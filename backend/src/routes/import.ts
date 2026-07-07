import { Router, Request, Response } from 'express';
import multer from 'multer';
import { parseCSV, getHeaders } from '../services/csvService';
import { extractCrmBatch } from '../services/aiService';
import { ImportResult } from '../types/crm';

const router = Router();

// Use memory storage — no disk writes
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit
  fileFilter: (_req, file, cb) => {
    if (
      file.mimetype === 'text/csv' ||
      file.mimetype === 'application/vnd.ms-excel' ||
      file.originalname.endsWith('.csv')
    ) {
      cb(null, true);
    } else {
      cb(new Error('Only CSV files are allowed'));
    }
  },
});

// POST /api/import
// Accepts multipart CSV, returns structured CRM JSON
router.post('/', upload.single('file'), async (req: Request, res: Response): Promise<void> => {
  if (!req.file) {
    res.status(400).json({ error: 'No file uploaded' });
    return;
  }
  
  // 1. Parse CSV
  let rows: Record<string, string>[];
  try {
    rows = parseCSV(req.file.buffer);
  } catch (parseErr) {
    res.status(422).json({ error: `CSV parsing failed: ${(parseErr as Error).message}` });
    return;
  }

  if (rows.length === 0) {
    res.status(422).json({ error: 'CSV file is empty or has no data rows' });
    return;
  }

  const headers = getHeaders(rows);

  // Setup SSE Headers
  res.writeHead(200, {
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache',
    'Connection': 'keep-alive',
  });
  // Flush headers immediately
  res.flushHeaders();

  console.log(`\n📥 Starting SSE stream for: ${req.file.originalname} (${rows.length} rows)`);

  const sendEvent = (type: string, data: any) => {
    res.write(`event: ${type}\n`);
    res.write(`data: ${JSON.stringify(data)}\n\n`);
  };

  try {
    // 2. AI Extraction (streaming)
    await extractCrmBatch(rows, headers, (parsed, skipped, processed, total) => {
      sendEvent('batch', { parsed, skipped, processed, total });
    });

    // 3. Finish stream
    sendEvent('done', { success: true });
  } catch (err) {
    console.error('Import error:', err);
    const message = err instanceof Error ? err.message : 'Unknown error';
    
    if (message.includes('GEMINI_API_KEY is not set')) {
      sendEvent('error', { error: 'Gemini API Key is missing. Please add it to the backend/.env file.' });
    } else {
      sendEvent('error', { error: message });
    }
  } finally {
    res.end();
  }
});

export default router;
