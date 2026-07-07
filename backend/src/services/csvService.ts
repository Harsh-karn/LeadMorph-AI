import { parse } from 'csv-parse/sync';

export function parseCSV(buffer: Buffer): Record<string, string>[] {
  // Try to detect BOM and handle UTF-8/UTF-16
  let content = buffer.toString('utf-8');
  // Strip BOM if present
  if (content.charCodeAt(0) === 0xfeff) {
    content = content.slice(1);
  }

  const records = parse(content, {
    columns: true,           // Use first row as headers
    skip_empty_lines: true,
    trim: true,
    relax_quotes: true,
    relax_column_count: true,
    bom: true,
  }) as Record<string, string>[];

  return records;
}

export function getHeaders(records: Record<string, string>[]): string[] {
  if (records.length === 0) return [];
  return Object.keys(records[0]);
}
