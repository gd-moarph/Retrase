export function toCsv(rows: Array<Record<string, unknown>>): string {
  if (rows.length === 0) return "\uFEFF";
  const headers = Object.keys(rows[0]);
  const escape = (value: unknown) => {
    const text = value == null ? "" : String(value);
    return `"${text.replace(/"/g, '""')}"`;
  };
  return `\uFEFF${headers.join(",")}\n${rows
    .map((row) => headers.map((header) => escape(row[header])).join(","))
    .join("\n")}`;
}

export function csvResponse(fileName: string, csv: string): Response {
  return new Response(csv, {
    headers: {
      "content-type": "text/csv; charset=utf-8",
      "content-disposition": `attachment; filename="${fileName}"`,
    },
  });
}
