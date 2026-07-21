import * as cheerio from "cheerio";
import { PDFParse } from "pdf-parse";
import { prisma } from "@/lib/db";
import { sha256, sha256Buffer } from "@/lib/crypto";
import { normalizeForComparison, normalizeText } from "@/lib/normalize";
import { fetchText, fetchWithRetry } from "@/lib/retry";
import {
  completeSourceRun,
  createOrUpdateSourceItem,
  createSourceRun,
  type ImporterResult,
  storeSourceDocument,
  updateDocumentStatus,
} from "@/importers/base";

const DISCONTINUITY_PAGE_URL = process.env.ANM_DISCONTINUITY_URL ||
  "https://www.anm.ro/medicamente-de-uz-uman/autorizare-medicamente/notificari-discontinuitate-medicamente/";
const PARSER_VERSION = "pdf-parse@2.4.5/table-v2";

export type DiscontinuityImportOptions = { dryRun?: boolean; force?: boolean };

export type DiscontinuityRow = {
  stableKey: string;
  commercialName: string;
  pharmaceuticalForm: string;
  concentration: string;
  authorizationHolder: string;
  holderCountry: string;
  dci: string;
  addressDate: string;
  notificationType: string;
  estimatedResumeDateText: string;
  observations: string;
  rawRowText: string;
  rowNumber: number;
  sourcePage: number;
};

export async function importMedicineDiscontinuities(
  options: DiscontinuityImportOptions = {},
): Promise<ImporterResult> {
  const runId = await createSourceRun("ANM_DISCONTINUITY");
  const result: Omit<ImporterResult, "runId"> = {
    status: "RUNNING",
    itemsFound: 0,
    itemsInserted: 0,
    itemsUpdated: 0,
    documentsDownloaded: 0,
  };
  let documentId: string | undefined;

  try {
    const pdfUrl = await discoverDiscontinuityPdfUrl();
    const response = await fetchWithRetry(pdfUrl, { timeout: 60_000 });
    const buffer = Buffer.from(await response.arrayBuffer());
    const documentHash = sha256Buffer(buffer);
    const existingDocument = await prisma.sourceDocument.findFirst({
      where: { sourceType: "ANM_DISCONTINUITY", sha256: documentHash },
    });

    if (existingDocument?.parseStatus === "PARSED" && !options.force) {
      result.status = "NO_CHANGE";
      await completeSourceRun(runId, result);
      return { ...result, runId };
    }

    documentId = await storeSourceDocument({
      sourceRunId: runId,
      sourceType: "ANM_DISCONTINUITY",
      url: pdfUrl,
      mimeType: "application/pdf",
      fileName: decodeURIComponent(new URL(pdfUrl).pathname.split("/").pop() || "discontinuity.pdf"),
      fileSize: buffer.length,
      sha256: documentHash,
      binaryData: buffer,
      parseStatus: "PENDING",
    });
    result.documentsDownloaded = existingDocument ? 0 : 1;

    const parsed = await parseDiscontinuityPdf(buffer);
    result.itemsFound = parsed.rows.length;
    validateDiscontinuityRows(parsed.rows, options.force === true);

    const previousCount = await prisma.medicineDiscontinuity.count({ where: { isPresentInLatest: true } });
    if (!options.force && previousCount > 0 && parsed.rows.length < previousCount * 0.9) {
      throw new Error(`Documentul are cu peste 10% mai puține rânduri (${parsed.rows.length} față de ${previousCount})`);
    }

    if (options.dryRun) {
      await updateDocumentStatus(documentId, { parseStatus: "PARSED", extractedText: parsed.text });
      result.status = "SUCCESS";
      await completeSourceRun(runId, result);
      return { ...result, runId };
    }

    const sourceItem = await createOrUpdateSourceItem({
      sourceType: "ANM_DISCONTINUITY",
      externalId: "anm-discontinuity-current",
      sourceUrl: pdfUrl,
      title: "Notificări discontinuitate medicamente - ANMDMR",
      sourceDocumentId: documentId,
      contentHash: documentHash,
      publishedAt: documentDateFromUrl(pdfUrl) || new Date(),
    });

    const counts = await publishDiscontinuities(sourceItem.id, parsed.rows);
    result.itemsInserted = counts.inserted;
    result.itemsUpdated = counts.updated;
    await prisma.sourceDocument.update({
      where: { id: documentId },
      data: {
        parseStatus: "PARSED",
        parseError: null,
        extractedText: parsed.text,
        parserVersion: PARSER_VERSION,
      },
    });
    result.status = "SUCCESS";
  } catch (error) {
    result.status = "FAILED";
    result.errorMessage = error instanceof Error ? error.message : String(error);
    if (documentId) {
      await updateDocumentStatus(documentId, { parseStatus: "FAILED", parseError: result.errorMessage });
    }
    console.error("[ANM_DISCONTINUITY] Import failed:", error);
  }

  await completeSourceRun(runId, result);
  return { ...result, runId };
}

async function discoverDiscontinuityPdfUrl(): Promise<string> {
  const html = await fetchText(DISCONTINUITY_PAGE_URL);
  const $ = cheerio.load(html);
  let preferred = "";
  let fallback = "";

  $("a[href]").each((_, element) => {
    const href = $(element).attr("href");
    if (!href || !/\.pdf(?:$|\?)/i.test(href)) return;
    const absolute = new URL(href, DISCONTINUITY_PAGE_URL).href;
    if (!fallback) fallback = absolute;
    const label = $(element).text().toLocaleLowerCase("ro");
    if (label.includes("descarc") && label.includes("document")) preferred = absolute;
  });

  const url = preferred || fallback;
  if (!url) throw new Error("Nu s-a găsit documentul PDF pe pagina ANMDMR");
  return url;
}

export async function parseDiscontinuityPdf(
  buffer: Buffer,
): Promise<{ text: string; rows: DiscontinuityRow[]; pages: number }> {
  const parser = new PDFParse({ data: buffer });
  try {
    const result = await parser.getText({ lineThreshold: 2, cellThreshold: 2 });
    if (!result.text.trim()) throw new Error("PDF-ul nu conține text extractibil");
    const rows = result.pages.flatMap((page) => parseDiscontinuityPageText(page.text, page.num));
    return { text: result.text, rows: deduplicateRows(rows), pages: result.total };
  } finally {
    await parser.destroy();
  }
}

export function parseDiscontinuityPageText(text: string, pageNumber: number): DiscontinuityRow[] {
  const records: string[][] = [];
  let current: string[] = [];

  const flush = () => {
    if (current.length) records.push(current);
    current = [];
  };

  for (const rawLine of text.split(/\r?\n/)) {
    const line = rawLine.trim();
    if (!line || /^(Nr crt|Denumire comerciala|Data estimativa de|reluare a|comercializarii)/i.test(line) ||
      /^NOTIFICARI ALE DETINATORILOR/i.test(line)) continue;
    const rowStart = line.match(/^(\d{1,4})(?:\s+\S|$)/);
    if (rowStart && Number(rowStart[1]) > 0 && Number(rowStart[1]) < 1500) {
      flush();
      current = [line];
    } else if (current.length) {
      current.push(line);
    }
  }
  flush();

  return records.map((record) => parseRecord(record, pageNumber)).filter((row): row is DiscontinuityRow => row !== null);
}

function parseRecord(lines: string[], sourcePage: number): DiscontinuityRow | null {
  const rawRowText = lines.join("\n").slice(0, 4_000);
  const cells = lines.join(" ").split(/\t+/).map((cell) => cell.replace(/\s+/g, " ").trim()).filter(Boolean);
  const first = cells[0]?.match(/^(\d{1,4})\s+(.+)$/);
  if (!first) return null;

  const rowNumber = Number(first[1]);
  const commercialName = first[2].trim();
  const dateIndex = cells.findIndex((cell, index) => index > 0 && /\b\d{1,2}\.\d{1,2}\.\d{4}\b/.test(cell));
  if (dateIndex < 3 || invalidCommercialName(commercialName)) return null;

  const dateCell = cells[dateIndex];
  const dateMatch = dateCell.match(/\b(\d{1,2}\.\d{1,2}\.\d{4})\b/);
  if (!dateMatch) return null;
  const addressDate = dateMatch[1];
  const notificationType = dateCell.slice((dateMatch.index || 0) + dateMatch[0].length).trim();
  const beforeDate = cells.slice(1, dateIndex);
  const afterDate = cells.slice(dateIndex + 1);

  const pharmaceuticalForm = beforeDate[0] || "";
  let concentration = "";
  let cursor = 1;
  if (beforeDate[cursor] && looksLikeConcentration(beforeDate[cursor])) {
    concentration = beforeDate[cursor];
    cursor++;
  }

  const remaining = beforeDate.slice(cursor);
  const country = splitCountryAndRemainder(remaining);
  const holderCountry = country.country;
  let dci = country.remainder;
  let authorizationHolder = country.before.join(" ");

  if (!holderCountry) {
    dci = remaining.at(-1) || "";
    authorizationHolder = remaining.slice(0, -1).join(" ");
  } else if (!dci && country.after.length) {
    dci = country.after.join(" ");
  }

  const observations = afterDate.join(" ").trim();
  const stableKey = sha256([
    normalizeForComparison(commercialName),
    normalizeForComparison(pharmaceuticalForm),
    normalizeForComparison(concentration),
    normalizeForComparison(dci),
    normalizeForComparison(authorizationHolder),
    addressDate,
  ].join("|"));

  return {
    stableKey,
    commercialName: commercialName.slice(0, 300),
    pharmaceuticalForm,
    concentration,
    authorizationHolder,
    holderCountry,
    dci,
    addressDate,
    notificationType,
    estimatedResumeDateText: extractResumeDate(`${notificationType} ${observations}`),
    observations,
    rawRowText,
    rowNumber,
    sourcePage,
  };
}

const COUNTRIES = [
  "AFRICA DE SUD", "MAREA BRITANIE", "REPUBLICA CEHA", "ROMANIA", "GERMANIA", "IRLANDA",
  "FRANTA", "ITALIA", "SPANIA", "POLONIA", "BELGIA", "AUSTRIA", "ELVETIA", "SUEDIA",
  "DANEMARCA", "FINLANDA", "OLANDA", "PORTUGALIA", "BULGARIA", "UNGARIA", "CEHIA",
  "SLOVACIA", "GRECIA", "SUA", "JAPONIA", "TURCIA", "INDIA", "CHINA", "ISRAEL",
  "COREEA", "SLOVENIA", "LITUANIA", "LETONIA", "ESTONIA", "CROATIA", "UCRAINA",
  "RUSIA", "BRAZILIA", "MEXIC", "ARGENTINA", "AUSTRALIA", "CANADA", "MALTA", "CIPRU",
];

function splitCountryAndRemainder(cells: string[]): {
  country: string;
  remainder: string;
  before: string[];
  after: string[];
} {
  for (let index = 0; index < cells.length; index++) {
    const upper = cells[index].toLocaleUpperCase("ro");
    for (const country of COUNTRIES) {
      const position = upper.indexOf(country);
      if (position < 0) continue;
      const beforeText = cells[index].slice(0, position).trim();
      const remainder = cells[index].slice(position + country.length).trim();
      return {
        country,
        remainder,
        before: [...cells.slice(0, index), ...(beforeText ? [beforeText] : [])],
        after: cells.slice(index + 1),
      };
    }
  }
  return { country: "", remainder: "", before: [], after: [] };
}

function validateDiscontinuityRows(rows: DiscontinuityRow[], force: boolean): void {
  if (!rows.length) throw new Error("Nu s-a putut extrage niciun rând din PDF");
  if (!force && rows.length < 500) throw new Error(`Număr neverosimil de rânduri extrase: ${rows.length}`);
  const invalid = rows.filter((row) => invalidCommercialName(row.commercialName) || row.rowNumber >= 1500);
  if (invalid.length) throw new Error(`Au fost extrase ${invalid.length} rânduri invalide`);
}

async function publishDiscontinuities(sourceItemId: string, rows: DiscontinuityRow[]) {
  return prisma.$transaction(async (tx) => {
    await tx.medicineDiscontinuity.updateMany({ data: { isPresentInLatest: false } });
    let inserted = 0;
    let updated = 0;

    for (const row of rows) {
      const existing = await tx.medicineDiscontinuity.findUnique({ where: { stableKey: row.stableKey } });
      const data = {
        sourceItemId,
        commercialName: row.commercialName,
        normalizedCommercialName: normalizeText(row.commercialName),
        pharmaceuticalForm: row.pharmaceuticalForm,
        concentration: row.concentration,
        authorizationHolder: row.authorizationHolder,
        holderCountry: row.holderCountry,
        dci: row.dci,
        normalizedDci: normalizeText(row.dci),
        addressDate: row.addressDate,
        notificationType: row.notificationType,
        estimatedResumeDateText: row.estimatedResumeDateText,
        observations: row.observations,
        rawRowText: row.rawRowText,
        rowNumber: row.rowNumber,
        sourcePage: row.sourcePage,
        isPresentInLatest: true,
      };

      if (!existing) {
        await tx.medicineDiscontinuity.create({ data: { ...data, stableKey: row.stableKey } });
        inserted++;
        continue;
      }

      if (existing.rawRowText !== row.rawRowText) {
        await tx.medicineDiscontinuityVersion.create({
          data: {
            medicineDiscontinuityId: existing.id,
            contentHash: sha256(row.rawRowText),
            rawRowText: row.rawRowText,
          },
        });
        updated++;
      }
      await tx.medicineDiscontinuity.update({ where: { id: existing.id }, data });
    }

    return { inserted, updated };
  }, { timeout: 120_000 });
}

function deduplicateRows(rows: DiscontinuityRow[]): DiscontinuityRow[] {
  const unique = new Map<string, DiscontinuityRow>();
  for (const row of rows) unique.set(row.stableKey, row);
  return [...unique.values()].sort((left, right) => left.rowNumber - right.rowNumber);
}

function looksLikeConcentration(value: string): boolean {
  return /\d/.test(value) && /(?:mg|mcg|μg|ml|\bg\b|%|ui|doze|afxa)/i.test(value);
}

function invalidCommercialName(value: string): boolean {
  return !value || /^(discontinuitate|notificari|data estimativa|motive\b)/i.test(value) || /^\d{4}$/.test(value);
}

function extractResumeDate(text: string): string {
  return text.match(/\b(?:ian\.|feb\.|mar\.|apr\.|mai|iun\.|iul\.|aug\.|sept\.|oct\.|nov\.|dec\.)-?\d{2}\b/i)?.[0] ||
    text.match(/\b(?:ianuarie|februarie|martie|aprilie|mai|iunie|iulie|august|septembrie|octombrie|noiembrie|decembrie)\s+\d{4}\b/i)?.[0] || "";
}

function documentDateFromUrl(url: string): Date | null {
  const decoded = decodeURIComponent(url);
  const match = decoded.match(/(\d{1,2})\.(\d{1,2})\.(\d{4})/);
  if (!match) return null;
  return new Date(Date.UTC(Number(match[3]), Number(match[2]) - 1, Number(match[1])));
}
