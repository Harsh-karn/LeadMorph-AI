import { GoogleGenAI } from '@google/genai';
import { CrmRecord } from '../types/crm';
import { validateAndClean } from './crmMapper';

const GEMINI_API_KEY = process.env.GEMINI_API_KEY || '';
const BATCH_SIZE = parseInt(process.env.BATCH_SIZE || '15', 10);
const MAX_RETRIES = 3;

// Initialize Gemini SDK
const ai = new GoogleGenAI({ apiKey: GEMINI_API_KEY });

const SYSTEM_PROMPT = `Map CSV rows to CRM fields. Return ONLY a valid JSON array of objects.

CRM Fields:
- created_at: Lead creation date (must be parseable by new Date())
- name: Lead name
- email: Primary email
- country_code: Country code
- mobile_without_country_code: Mobile number
- company: Company name
- city: City
- state: State
- country: Country
- lead_owner: Lead owner
- crm_status: Lead status
- crm_note: Notes, remarks, extra info
- data_source: Source
- possession_time: Property possession time
- description: Additional description

Rules:
1. crm_status MUST be one of: [GOOD_LEAD_FOLLOW_UP, DID_NOT_CONNECT, BAD_LEAD, SALE_DONE, ""]
2. data_source MUST be one of: [leads_on_demand, meridian_tower, eden_park, varah_swamy, sarjapur_plots, ""]. If none match confidently, leave it blank.
3. crm_note: Use for remarks, follow-up notes, additional comments, extra phone numbers, extra email addresses, or any useful info that doesn't fit another field.
4. Multiple Emails: Use the first email. Append remaining emails into crm_note.
5. Multiple Mobiles: Use the first mobile. Append remaining numbers into crm_note.
6. Escape line breaks (e.g., \\n) so the JSON remains valid.
7. Skip Invalid Records: If a record contains NEITHER email NOR mobile number, output {"skip": true, "reason": "Missing both email and mobile number"}.

Output MUST be a JSON array. Example:
[{"name": "John", "email": "j@ex.com", "mobile_without_country_code": "123", "crm_status": "", "crm_note": ""}]`;

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
  onBatchComplete?: (batchParsed: CrmRecord[], batchSkipped: SkippedResult[], processed: number, total: number) => void
): Promise<BatchResult> {
  const allParsed: CrmRecord[] = [];
  const allSkipped: SkippedResult[] = [];

  for (let i = 0; i < rows.length; i += BATCH_SIZE) {
    const batch = rows.slice(i, i + BATCH_SIZE);
    const result = await processBatchWithRetry(batch, headers);
    allParsed.push(...result.parsed);
    allSkipped.push(...result.skipped);

    if (onBatchComplete) {
      onBatchComplete(
        result.parsed,
        result.skipped,
        Math.min(i + BATCH_SIZE, rows.length),
        rows.length
      );
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
  if (!GEMINI_API_KEY) {
    throw new Error('GEMINI_API_KEY is not set in backend/.env');
  }

  const userMessage = `CSV Headers: ${headers.join(', ')}

Rows to process (${batch.length} records):
${JSON.stringify(batch, null, 2)}

Map these records to the CRM format. Return ONLY a JSON array.`;

  console.log(`Sending batch of ${batch.length} rows to Gemini...`);
  
  const response = await ai.models.generateContent({
    model: 'gemini-2.5-flash',
    contents: userMessage,
    config: {
      systemInstruction: SYSTEM_PROMPT,
      temperature: 0.1,
    }
  });

  console.log(`Received response from Gemini API.`);

  const rawText = response.text?.trim() || '';

  // Extract JSON array from response (handle markdown code blocks)
  const jsonMatch = rawText.match(/\[[\s\S]*\]/);
  if (!jsonMatch) {
    console.error(`[AI ERROR] No JSON array found in output:\n${rawText}`);
    throw new Error(`No JSON array found in model response`);
  }

  let aiOutputRows: AiOutputRow[];
  try {
    aiOutputRows = JSON.parse(jsonMatch[0]);
  } catch (err) {
    console.error(`[AI ERROR] Failed to parse JSON:\n${jsonMatch[0]}`);
    throw new Error(`Failed to parse AI output as JSON`);
  }

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
