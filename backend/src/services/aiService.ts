import { CrmRecord } from '../types/crm';
import { validateAndClean } from './crmMapper';

const LM_STUDIO_URL = process.env.LM_STUDIO_URL || 'http://127.0.0.1:1234/v1/chat/completions';
const MODEL_NAME = process.env.LM_STUDIO_MODEL || 'local-model';
const BATCH_SIZE = parseInt(process.env.BATCH_SIZE || '15', 10);
const MAX_RETRIES = 3;

const SYSTEM_PROMPT = `You are a CRM data extraction assistant. Your job is to map CSV rows to GrowEasy CRM fields.

## Target CRM Fields
- created_at: Lead creation date (ISO string format, e.g. "2026-05-13T14:20:48Z")
- name: Full name of the lead
- email: Primary email address
- country_code: Country dial code (e.g. +91, +1)
- mobile_without_country_code: Mobile number WITHOUT country code
- company: Company or organization name
- city: City
- state: State or province
- country: Country name
- lead_owner: Email or name of the person who owns this lead
- crm_status: MUST be one of: GOOD_LEAD_FOLLOW_UP, DID_NOT_CONNECT, BAD_LEAD, SALE_DONE — or empty string ""
- crm_note: Notes, remarks, follow-ups, extra phone numbers, extra emails, or any info that doesn't fit elsewhere
- data_source: MUST be one of: leads_on_demand, meridian_tower, eden_park, varah_swamy, sarjapur_plots — or empty string ""
- possession_time: Property possession time if mentioned
- description: Additional description or comments

## Rules
1. Map columns intelligently — column names in the CSV may be different (e.g. "Full Name" maps to name, "Phone" maps to mobile_without_country_code)
2. If multiple emails exist: use first as email, put rest in crm_note
3. If multiple mobile numbers: use first as mobile, put rest in crm_note
4. crm_status MUST ONLY be one of the 4 allowed values or ""
5. data_source MUST ONLY be one of the 5 allowed values or ""
6. If a record has NEITHER email NOR mobile number, output {"skip": true, "reason": "no email or mobile"}
7. Do not add line breaks inside field values — use \\n if needed
8. Return ONLY a valid JSON array, no markdown, no explanation

## Output Format
Return a JSON array where each element is either:
- A CRM record object with all 15 fields
- {"skip": true, "reason": "explanation"} for records to skip`;

type AiOutputRow = Partial<CrmRecord> & { skip?: boolean; reason?: string };

export interface BatchResult {
  parsed: CrmRecord[];
  skipped: SkippedResult[];
}

export interface SkippedResult {
  row: Record<string, string>;
  reason: string;
}

export async function extractCrmBatch(
  rows: Record<string, string>[],
  headers: string[],
  onProgress?: (processed: number, total: number) => void
): Promise<BatchResult> {
  const allParsed: CrmRecord[] = [];
  const allSkipped: SkippedResult[] = [];

  for (let i = 0; i < rows.length; i += BATCH_SIZE) {
    const batch = rows.slice(i, i + BATCH_SIZE);
    const result = await processBatchWithRetry(batch, headers);
    allParsed.push(...result.parsed);
    allSkipped.push(...result.skipped);

    if (onProgress) {
      onProgress(Math.min(i + BATCH_SIZE, rows.length), rows.length);
    }
  }

  return { parsed: allParsed, skipped: allSkipped };
}

async function processBatchWithRetry(
  batch: Record<string, string>[],
  headers: string[]
): Promise<BatchResult> {
  let lastError: Error | null = null;

  for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
    try {
      return await processBatch(batch, headers);
    } catch (err) {
      lastError = err instanceof Error ? err : new Error(String(err));
      console.warn(`Batch attempt ${attempt} failed: ${lastError.message}`);
      if (attempt < MAX_RETRIES) {
        await sleep(1000 * attempt); // Exponential backoff
      }
    }
  }

  // All retries exhausted — mark all rows as skipped
  console.error('All retries exhausted for batch');
  return {
    parsed: [],
    skipped: batch.map((row) => ({
      row,
      reason: `AI processing failed after ${MAX_RETRIES} attempts: ${lastError?.message}`,
    })),
  };
}

async function processBatch(
  batch: Record<string, string>[],
  headers: string[]
): Promise<BatchResult> {
  const userMessage = `CSV Headers: ${headers.join(', ')}

Rows to process (${batch.length} records):
${JSON.stringify(batch, null, 2)}

Map these records to the CRM format. Return ONLY a JSON array.`;

  console.log(`Sending batch of ${batch.length} rows to LM Studio...`);
  const response = await fetch(LM_STUDIO_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model: MODEL_NAME,
      messages: [
        { role: 'system', content: SYSTEM_PROMPT },
        { role: 'user', content: userMessage },
      ],
      temperature: 0.1,
    }),
  });
  console.log(`Received response from LM Studio: ${response.status}`);

  if (!response.ok) {
    const errText = await response.text();
    throw new Error(`LM Studio API Error (${response.status}): ${errText}`);
  }

  const data = await response.json() as any;
  const rawText = data.choices?.[0]?.message?.content?.trim() || '';

  // Extract JSON array from response (handle markdown code blocks)
  const jsonMatch = rawText.match(/\[[\s\S]*\]/);
  if (!jsonMatch) {
    throw new Error(`No JSON array found in model response: ${rawText.slice(0, 200)}`);
  }

  const aiOutputRows: AiOutputRow[] = JSON.parse(jsonMatch[0]);

  const parsed: CrmRecord[] = [];
  const skipped: SkippedResult[] = [];

  for (let i = 0; i < aiOutputRows.length; i++) {
    const aiRow = aiOutputRows[i];
    const originalRow = batch[i] || {};

    if (aiRow.skip) {
      skipped.push({ row: originalRow, reason: aiRow.reason || 'Skipped by AI' });
      continue;
    }

    const { record, valid, reason } = validateAndClean(aiRow as Partial<CrmRecord>);
    if (!valid) {
      skipped.push({ row: originalRow, reason: reason || 'Validation failed' });
    } else {
      parsed.push(record);
    }
  }

  return { parsed, skipped };
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
