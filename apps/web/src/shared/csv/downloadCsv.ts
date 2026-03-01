function escapeCsvCell(value: string): string {
  return `"${value.replace(/"/g, "\"\"")}"`;
}

function toCsvContent(headers: string[], rows: string[][]): string {
  return [headers, ...rows]
    .map((line) => line.map(escapeCsvCell).join(","))
    .join("\n");
}

export function downloadCsv(filename: string, headers: string[], rows: string[][]): void {
  if (typeof window === "undefined" || typeof document === "undefined") {
    return;
  }
  const csv = toCsvContent(headers, rows);
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.setAttribute("download", filename);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
