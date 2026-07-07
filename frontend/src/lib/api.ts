export interface CrmRecord {
  created_at: string;
  name: string;
  email: string;
  country_code: string;
  mobile_without_country_code: string;
  company: string;
  city: string;
  state: string;
  country: string;
  lead_owner: string;
  crm_status: string;
  crm_note: string;
  data_source: string;
  possession_time: string;
  description: string;
}

export interface SkippedRecord {
  row: Record<string, string>;
  reason: string;
}

export interface ImportResult {
  parsed: CrmRecord[];
  skipped: number;
  total: number;
  skippedRecords: SkippedRecord[];
}

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:4000';

export async function importCSV(file: File): Promise<ImportResult> {
  const formData = new FormData();
  formData.append('file', file);

  const response = await fetch(`${BACKEND_URL}/api/import`, {
    method: 'POST',
    body: formData,
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
    throw new Error(errorData.error || `Server error: ${response.status}`);
  }

  return response.json() as Promise<ImportResult>;
}

export function exportToCSV(records: CrmRecord[], filename = 'crm-export.csv'): void {
  const headers = [
    'created_at', 'name', 'email', 'country_code', 'mobile_without_country_code',
    'company', 'city', 'state', 'country', 'lead_owner', 'crm_status',
    'crm_note', 'data_source', 'possession_time', 'description',
  ];

  const escape = (val: string) => `"${(val || '').replace(/"/g, '""')}"`;

  const rows = [
    headers.join(','),
    ...records.map((r) => headers.map((h) => escape(r[h as keyof CrmRecord])).join(',')),
  ];

  const blob = new Blob([rows.join('\n')], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}
