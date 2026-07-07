import Papa from 'papaparse';

export interface ParsedCSV {
  headers: string[];
  rows: Record<string, string>[];
  totalRows: number;
}

export function parseCSVFile(file: File): Promise<ParsedCSV> {
  return new Promise((resolve, reject) => {
    Papa.parse<Record<string, string>>(file, {
      header: true,
      skipEmptyLines: true,
      dynamicTyping: false, // Keep everything as strings
      transformHeader: (header) => header.trim(),
      complete: (results) => {
        const rows = results.data.map((row) =>
          Object.fromEntries(
            Object.entries(row).map(([k, v]) => [k, String(v ?? '').trim()])
          )
        );
        const headers = results.meta.fields ?? [];
        resolve({ headers, rows, totalRows: rows.length });
      },
      error: (err) => {
        reject(new Error(`CSV parse error: ${err.message}`));
      },
    });
  });
}

export function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}
