import { describe, expect, it } from "vitest";
import ExcelJS from "exceljs";
import { parseNomenclatureWorkbook } from "../anm-nomenclature";

const base = {
  "Cod CIM": "W00001001",
  "Denumire comerciala": "MEDICAMENT 10 mg",
  DCI: "SUBSTANTIUM",
  "Forma farmaceutica": "COMPR.",
  Concentratie: "10mg",
  "Cod ATC": "A01AA01",
  Ambalaj: "Cutie cu 10 comprimate",
  "Data actualizare": "21.07.26",
  "Firma / tara detinatoare APP": "COMPANIE - ROMANIA",
  "Firma / tara producatoare APP": "PRODUCATOR - ROMANIA",
  Prescriptie: "PR",
};

async function workbook(records: Record<string, string>[]) {
  const book = new ExcelJS.Workbook();
  const sheet = book.addWorksheet("Nomenclator");
  const headers = Object.keys(records[0]);
  sheet.addRow(headers);
  records.forEach((record) => sheet.addRow(headers.map((header) => record[header] ?? "")));
  return Buffer.from(await book.xlsx.writeBuffer());
}

describe("ANMDMR nomenclature", () => {
  it("uses CIM and ATC as the canonical source key", async () => {
    const rows = await parseNomenclatureWorkbook(await workbook([base, { ...base, "Cod ATC": "A01AA02" }]), true);
    expect(rows.map((row) => row.sourceKey)).toEqual(["W00001001|A01AA01", "W00001001|A01AA02"]);
    expect(rows[0].cimCode).toBe("W00001001");
    expect(rows[0].sourceUpdatedAt?.toISOString()).toBe("2026-07-21T00:00:00.000Z");
  });

  it("uses a deterministic key when ATC is blank", async () => {
    const [row] = await parseNomenclatureWorkbook(await workbook([{ ...base, "Cod ATC": "" }]), true);
    expect(row.sourceKey).toBe("W00001001|NO_ATC");
  });

  it("rejects duplicate canonical keys before publishing", async () => {
    await expect(parseNomenclatureWorkbook(await workbook([base, base]), true)).rejects.toThrow("Cheie duplicată");
  });
});
