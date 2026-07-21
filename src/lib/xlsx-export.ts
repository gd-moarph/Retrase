import ExcelJS from "exceljs";

interface XlsxCell {
  value: string | number | Date | null | undefined;
  link?: string | null;
}

export type XlsxRow = Record<string, XlsxCell["value"] | XlsxCell>;

function normalizeCell(value: XlsxRow[string]): XlsxCell {
  if (value && typeof value === "object" && "value" in value) {
    return value as XlsxCell;
  }
  return { value };
}

export async function createXlsxBuffer(sheetName: string, rows: XlsxRow[]): Promise<Buffer> {
  const headers = rows.length > 0 ? Object.keys(rows[0]) : [];
  const workbook = new ExcelJS.Workbook();
  workbook.creator = "Retrase.ro";
  workbook.title = sheetName;
  const worksheet = workbook.addWorksheet(sheetName.slice(0, 31));
  worksheet.columns = headers.map((header) => ({
    header,
    key: header,
    width: Math.min(Math.max(header.length + 8, 16), header === "Sursa" ? 26 : 42),
  }));

  rows.forEach((row) => {
    const worksheetRow = worksheet.addRow(headers.map((header) => normalizeCell(row[header]).value ?? ""));
    headers.forEach((header, columnIndex) => {
      const cell = normalizeCell(row[header]);
      if (!cell.link) return;
      worksheetRow.getCell(columnIndex + 1).value = {
        text: String(cell.value ?? cell.link),
        hyperlink: cell.link,
        tooltip: "Click aici - vezi sursa",
      };
    });
  });

  if (headers.length) worksheet.autoFilter = { from: "A1", to: worksheet.getCell(1, headers.length).address };
  worksheet.getRow(1).font = { bold: true };
  return Buffer.from(await workbook.xlsx.writeBuffer());
}

export function xlsxResponse(fileName: string, buffer: Buffer): Response {
  const body = new Uint8Array(buffer);
  return new Response(body, {
    headers: {
      "content-type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "content-disposition": `attachment; filename="${fileName}"`,
      "cache-control": "no-store",
    },
  });
}
