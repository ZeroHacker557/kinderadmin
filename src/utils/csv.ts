type CsvDownloadOptions = {
  delimiter?: ',' | ';' | '\t';
  /**
   * Helps Excel correctly detect UTF-8 (incl. Uzbek chars).
   * Kept enabled by default for better real-world compatibility.
   */
  includeUtf8Bom?: boolean;
  /**
   * Force column order. Any missing keys become empty cells.
   */
  headers?: string[];
};

export function downloadCsv(
  filename: string,
  rows: Array<Record<string, unknown>>,
  options: CsvDownloadOptions = {},
) {
  if (!rows.length) return;

  const delimiter = options.delimiter ?? ',';
  const includeUtf8Bom = options.includeUtf8Bom ?? true;

  const headers =
    options.headers ??
    (() => {
      const ordered: string[] = [];
      const seen = new Set<string>();
      for (const row of rows) {
        for (const key of Object.keys(row)) {
          if (!seen.has(key)) {
            seen.add(key);
            ordered.push(key);
          }
        }
      }
      return ordered;
    })();

  const escapeCell = (value: unknown) => {
    const str = value == null ? '' : String(value);
    const mustQuote =
      str.includes('"') || str.includes('\n') || str.includes('\r') || str.includes(delimiter);
    if (mustQuote) return `"${str.replace(/"/g, '""')}"`;
    return str;
  };

  const lines = [
    headers.join(delimiter),
    ...rows.map((row) => headers.map((header) => escapeCell(row[header])).join(delimiter)),
  ];

  const content = (includeUtf8Bom ? '\ufeff' : '') + lines.join('\r\n');
  const blob = new Blob([content], { type: 'text/csv;charset=utf-8;' });

  // IE/old Edge (very rare now) fallback
  const nav = navigator as unknown as { msSaveOrOpenBlob?: (b: Blob, name: string) => void };
  if (typeof nav.msSaveOrOpenBlob === 'function') {
    nav.msSaveOrOpenBlob(blob, filename);
    return;
  }

  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  link.rel = 'noopener';
  link.style.display = 'none';
  document.body.appendChild(link);

  // Keep the click synchronous to preserve the user-gesture (otherwise some browsers block downloads).
  try {
    link.click();
  } finally {
    link.remove();
    // Give the browser a beat to start the download before revoking.
    window.setTimeout(() => URL.revokeObjectURL(url), 1000);
  }
}
