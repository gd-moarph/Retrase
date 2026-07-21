import { Prisma } from "@prisma/client";
import { readSheet } from "read-excel-file/node";
import { prisma } from "@/lib/db";
import { sha256, sha256Buffer } from "@/lib/crypto";
import { normalizeForComparison } from "@/lib/normalize";
import { fetchWithRetry } from "@/lib/retry";
import {
  completeSourceRun,
  createSourceRun,
  type ImporterResult,
  storeSourceDocument,
  updateDocumentStatus,
} from "@/importers/base";

const XLSX_URL = process.env.ANM_NOMENCLATOR_XLSX_URL || "https://nomenclator.anm.ro/files/nomenclator.xlsx";
const REQUIRED_HEADERS = [
  "Cod CIM",
  "Denumire comerciala",
  "DCI",
  "Forma farmaceutica",
  "Concentratie",
  "Cod ATC",
  "Ambalaj",
  "Data actualizare",
] as const;

export type NomenclatureImportOptions = { dryRun?: boolean; force?: boolean };

export type MedicineRow = {
  sourceKey: string;
  commercialName: string;
  normalizedCommercialName: string;
  dci: string;
  normalizedDci: string;
  pharmaceuticalForm: string;
  concentration: string;
  atcCode: string;
  cimCode: string;
  appHolder: string;
  producer: string;
  prescription: string;
  packageDescription: string;
  contentHash: string;
  sourceUpdatedAt: Date | null;
};

export async function importNomenclature(options: NomenclatureImportOptions = {}): Promise<ImporterResult> {
  const runId = await createSourceRun("ANM_NOMENCLATURE");
  let documentId: string | undefined;
  const result: Omit<ImporterResult, "runId"> = {
    status: "RUNNING",
    itemsFound: 0,
    itemsInserted: 0,
    itemsUpdated: 0,
    documentsDownloaded: 0,
  };

  try {
    const response = await fetchWithRetry(XLSX_URL, { timeout: 60_000 });
    const buffer = Buffer.from(await response.arrayBuffer());
    const documentHash = sha256Buffer(buffer);
    const existingDocument = await prisma.sourceDocument.findFirst({
      where: { sourceType: "ANM_NOMENCLATURE", sha256: documentHash },
    });

    if (existingDocument?.parseStatus === "PARSED" && !options.force) {
      result.status = "NO_CHANGE";
      await completeSourceRun(runId, result);
      return { ...result, runId };
    }

    const rows = await parseNomenclatureWorkbook(buffer, options.force === true);
    result.itemsFound = rows.length;

    if (options.dryRun) {
      result.status = "SUCCESS";
      await completeSourceRun(runId, result);
      return { ...result, runId };
    }

    documentId = await storeSourceDocument({
      sourceRunId: runId,
      sourceType: "ANM_NOMENCLATURE",
      url: XLSX_URL,
      mimeType: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      fileName: "nomenclator.xlsx",
      fileSize: buffer.length,
      sha256: documentHash,
      binaryData: buffer,
      parseStatus: "PENDING",
    });
    result.documentsDownloaded = existingDocument ? 0 : 1;

    const counts = await publishNomenclature(rows);
    result.itemsInserted = counts.inserted;
    result.itemsUpdated = counts.updated;
    await updateDocumentStatus(documentId, { parseStatus: "PARSED" });
    result.status = "SUCCESS";
  } catch (error) {
    result.status = "FAILED";
    result.errorMessage = error instanceof Error ? error.message : String(error);
    if (documentId) {
      await updateDocumentStatus(documentId, {
        parseStatus: "FAILED",
        parseError: result.errorMessage,
      }).catch(() => undefined);
    }
    console.error("[NOMENCLATURE] Import failed:", error);
  }

  await completeSourceRun(runId, result);
  return { ...result, runId };
}

export async function parseNomenclatureWorkbook(buffer: Buffer, force = false): Promise<MedicineRow[]> {
  const worksheetRows = await readSheet(buffer);
  if (!worksheetRows.length) throw new Error("Nomenclatorul XLSX nu conține foi");
  const headers = worksheetRows[0].map((cell) => String(cell ?? "").trim());
  const records = worksheetRows.slice(1)
    .map((row) => Object.fromEntries(headers.map((header, index) => [header, String(row[index] ?? "").trim()])))
    .filter((record) => Object.values(record).some(Boolean));
  if (!records.length) throw new Error("Nomenclatorul XLSX este gol");

  const headerSet = new Set(headers);
  const missingHeaders = REQUIRED_HEADERS.filter((header) => !headerSet.has(header));
  if (missingHeaders.length) throw new Error(`Coloane obligatorii lipsă: ${missingHeaders.join(", ")}`);
  if (!force && (records.length < 20_000 || records.length > 100_000)) {
    throw new Error(`Număr neverosimil de rânduri în nomenclator: ${records.length}`);
  }

  const seen = new Set<string>();
  const rows = records.map((record, index) => {
    const cimCode = value(record, "Cod CIM");
    const atcCode = value(record, "Cod ATC");
    const commercialName = value(record, "Denumire comerciala");
    if (!cimCode) throw new Error(`Cod CIM lipsă la rândul ${index + 2}`);
    if (!commercialName) throw new Error(`Denumire comercială lipsă la rândul ${index + 2}`);

    const sourceKey = `${cimCode}|${atcCode || "NO_ATC"}`;
    if (seen.has(sourceKey)) throw new Error(`Cheie duplicată în nomenclator: ${sourceKey}`);
    seen.add(sourceKey);

    const dci = value(record, "DCI");
    const canonical = {
      sourceKey,
      commercialName,
      dci,
      pharmaceuticalForm: value(record, "Forma farmaceutica"),
      concentration: value(record, "Concentratie"),
      atcCode,
      cimCode,
      appHolder: value(record, "Firma / tara detinatoare APP"),
      producer: value(record, "Firma / tara producatoare APP"),
      prescription: value(record, "Prescriptie"),
      packageDescription: value(record, "Ambalaj"),
    };

    return {
      ...canonical,
      normalizedCommercialName: normalizeForComparison(commercialName),
      normalizedDci: normalizeForComparison(dci),
      contentHash: sha256(JSON.stringify(canonical)),
      sourceUpdatedAt: parseRomanianDate(value(record, "Data actualizare")),
    };
  });

  return rows;
}

async function publishNomenclature(rows: MedicineRow[]): Promise<{ inserted: number; updated: number }> {
  return prisma.$transaction(async (tx) => {
    await tx.$executeRaw`
      CREATE TEMP TABLE "medicine_import_stage" (
        "sourceKey" TEXT PRIMARY KEY,
        "commercialName" TEXT NOT NULL,
        "normalizedCommercialName" TEXT NOT NULL,
        "dci" TEXT,
        "normalizedDci" TEXT,
        "pharmaceuticalForm" TEXT,
        "concentration" TEXT,
        "atcCode" TEXT,
        "cimCode" TEXT NOT NULL,
        "appHolder" TEXT,
        "producer" TEXT,
        "prescription" TEXT,
        "packageDescription" TEXT,
        "contentHash" TEXT NOT NULL,
        "sourceUpdatedAt" TIMESTAMPTZ
      ) ON COMMIT DROP
    `;

    for (let offset = 0; offset < rows.length; offset += 400) {
      const chunk = rows.slice(offset, offset + 400);
      const values = Prisma.join(chunk.map((row) => Prisma.sql`(
        ${row.sourceKey}, ${row.commercialName}, ${row.normalizedCommercialName}, ${row.dci || null},
        ${row.normalizedDci || null}, ${row.pharmaceuticalForm || null}, ${row.concentration || null},
        ${row.atcCode || null}, ${row.cimCode}, ${row.appHolder || null}, ${row.producer || null},
        ${row.prescription || null}, ${row.packageDescription || null}, ${row.contentHash},
        CAST(${row.sourceUpdatedAt} AS timestamptz)
      )`));

      await tx.$executeRaw(Prisma.sql`
        INSERT INTO "medicine_import_stage" (
          "sourceKey", "commercialName", "normalizedCommercialName", "dci", "normalizedDci",
          "pharmaceuticalForm", "concentration", "atcCode", "cimCode", "appHolder", "producer",
          "prescription", "packageDescription", "contentHash", "sourceUpdatedAt"
        )
        VALUES ${values}
      `);
    }

    const changed = await tx.$queryRaw<Array<{ inserted: boolean }>>`
      INSERT INTO "medicines" (
        "id", "sourceKey", "commercialName", "normalizedCommercialName", "dci", "normalizedDci",
        "pharmaceuticalForm", "concentration", "atcCode", "cimCode", "appHolder", "producer",
        "prescription", "packageDescription", "contentHash", "sourceUpdatedAt", "isActive",
        "removedAt", "firstSeenAt", "lastSeenAt"
      )
      SELECT concat('med_', md5(random()::text || clock_timestamp()::text)),
        stage."sourceKey", stage."commercialName", stage."normalizedCommercialName", stage."dci",
        stage."normalizedDci", stage."pharmaceuticalForm", stage."concentration", stage."atcCode",
        stage."cimCode", stage."appHolder", stage."producer", stage."prescription",
        stage."packageDescription", stage."contentHash", stage."sourceUpdatedAt", TRUE, NULL::timestamptz, NOW(), NOW()
      FROM "medicine_import_stage" stage
      ON CONFLICT ("sourceKey") DO UPDATE SET
        "commercialName" = EXCLUDED."commercialName",
        "normalizedCommercialName" = EXCLUDED."normalizedCommercialName",
        "dci" = EXCLUDED."dci",
        "normalizedDci" = EXCLUDED."normalizedDci",
        "pharmaceuticalForm" = EXCLUDED."pharmaceuticalForm",
        "concentration" = EXCLUDED."concentration",
        "atcCode" = EXCLUDED."atcCode",
        "cimCode" = EXCLUDED."cimCode",
        "appHolder" = EXCLUDED."appHolder",
        "producer" = EXCLUDED."producer",
        "prescription" = EXCLUDED."prescription",
        "packageDescription" = EXCLUDED."packageDescription",
        "contentHash" = EXCLUDED."contentHash",
        "sourceUpdatedAt" = EXCLUDED."sourceUpdatedAt",
        "isActive" = TRUE,
        "removedAt" = NULL,
        "lastSeenAt" = NOW()
      WHERE "medicines"."contentHash" IS DISTINCT FROM EXCLUDED."contentHash"
         OR "medicines"."isActive" = FALSE
      RETURNING (xmax = 0) AS inserted
    `;

    await tx.$executeRaw`
      UPDATE "medicines" medicine
      SET "isActive" = FALSE, "removedAt" = NOW(), "lastSeenAt" = NOW()
      WHERE medicine."isActive" = TRUE
        AND NOT EXISTS (
          SELECT 1 FROM "medicine_import_stage" stage WHERE stage."sourceKey" = medicine."sourceKey"
        )
    `;

    return {
      inserted: changed.filter((item) => item.inserted).length,
      updated: changed.filter((item) => !item.inserted).length,
    };
  }, { timeout: 120_000 });
}

function value(record: Record<string, unknown>, key: string): string {
  return String(record[key] ?? "").trim();
}

function parseRomanianDate(input: string): Date | null {
  const match = input.match(/^(\d{1,2})[./-](\d{1,2})[./-](\d{2}|\d{4})$/);
  if (!match) return null;
  const year = Number(match[3]) + (match[3].length === 2 ? 2000 : 0);
  const date = new Date(Date.UTC(year, Number(match[2]) - 1, Number(match[1])));
  return Number.isNaN(date.getTime()) ? null : date;
}
