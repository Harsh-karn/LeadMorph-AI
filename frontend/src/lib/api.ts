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

export function importCSV(
  file: File,
  callbacks: {
    onBatch: (parsed: CrmRecord[], skipped: any[], processed: number, total: number) => void;
    onDone: () => void;
    onError: (err: string) => void;
  }
): void {
  const formData = new FormData();
  formData.append('file', file);

  const xhr = new XMLHttpRequest();
  xhr.open('POST', `${BACKEND_URL}/api/import`, true);
  
  let seenBytes = 0;

  xhr.onreadystatechange = () => {
    if (xhr.readyState === 3 || xhr.readyState === 4) {
      const newData = xhr.responseText.substring(seenBytes);
      if (!newData) return;
      seenBytes = xhr.responseText.length;

      const lines = newData.split('\n\n');
      for (const block of lines) {
        if (!block.trim()) continue;
        
        const linesInBlock = block.split('\n');
        let eventType = 'message';
        let dataStr = '';

        for (const line of linesInBlock) {
          if (line.startsWith('event: ')) {
            eventType = line.substring(7).trim();
          } else if (line.startsWith('data: ')) {
            dataStr = line.substring(6).trim();
          }
        }

        if (dataStr) {
          try {
            const data = JSON.parse(dataStr);
            if (eventType === 'batch') {
              callbacks.onBatch(data.parsed, data.skipped, data.processed, data.total);
            } else if (eventType === 'done') {
              callbacks.onDone();
            } else if (eventType === 'error') {
              callbacks.onError(data.error || 'Stream error');
            }
          } catch (e) {
            console.error('Failed to parse SSE JSON:', e);
          }
        }
      }
    }
  };

  xhr.onerror = () => {
    callbacks.onError('Network error occurred during import.');
  };

  xhr.send(formData);
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
