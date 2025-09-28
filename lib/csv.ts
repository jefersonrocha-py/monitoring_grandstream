export function toCSV(rows: Record<string, any>[], sep = ";") {
  if (!rows.length) return "";
  const headers = Object.keys(rows[0]);
  const headerLine = headers.join(sep);
  const body = rows
    .map((r) =>
      headers
        .map((h) => {
          const v = r[h] ?? "";
          const s = typeof v === "string" ? v : JSON.stringify(v);
          return `"${s.replace(/"/g, '""')}"`;
        })
        .join(sep)
    )
    .join("\n");
  return [headerLine, body].join("\n");
}
