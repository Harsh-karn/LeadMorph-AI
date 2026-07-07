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
  try {
    if (!req.file) {
      res.status(400).json({ error: 'No file uploaded' });
      return;
    }
    console.log(`\n📥 Received file upload: ${req.file.originalname} (${req.file.size} bytes)`);

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

    // 2. AI Extraction (batched)
    const { parsed, skipped } = await extractCrmBatch(rows, headers);

    const result: ImportResult = {
      parsed,
      skipped: skipped.length,
      total: rows.length,
      skippedRecords: skipped,
    };

    res.json(result);
  } catch (err) {
    console.error('Import error:', err);
    const message = err instanceof Error ? err.message : 'Unknown error';

    if (message.includes('ECONNREFUSED') || message.includes('fetch failed')) {
      res.status(503).json({
        error: 'Ollama is not running. Please start Ollama and ensure the model is pulled.',
        hint: 'Run: ollama serve  then  ollama pull llama3.2',
      });
      return;
    }

    res.status(500).json({ error: message });
  }
});

export default router;
