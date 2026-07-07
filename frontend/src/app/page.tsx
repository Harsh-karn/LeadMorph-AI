'use client';

import { useState, useCallback } from 'react';
import DropZone from '@/components/DropZone';
import PreviewTable from '@/components/PreviewTable';
import ResultTable from '@/components/ResultTable';
import ProgressBar from '@/components/ProgressBar';
import { parseCSVFile, ParsedCSV } from '@/lib/csvParser';
import { importCSV, exportToCSV, ImportResult } from '@/lib/api';

type Step = 'upload' | 'preview' | 'processing' | 'results';

export default function HomePage() {
  const [step, setStep] = useState<Step>('upload');
  const [file, setFile] = useState<File | null>(null);
  const [csvData, setCsvData] = useState<ParsedCSV | null>(null);
  const [result, setResult] = useState<ImportResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [progress, setProgress] = useState({ processed: 0, total: 0 });

  const stepIndex: Record<Step, number> = { upload: 1, preview: 2, processing: 3, results: 4 };
  const currentStep = stepIndex[step];

  const handleFileSelected = useCallback(async (selectedFile: File) => {
    setError(null);
    setFile(selectedFile);
    try {
      const parsed = await parseCSVFile(selectedFile);
      if (parsed.totalRows === 0) {
        setError('The CSV file appears to be empty or has no data rows.');
        return;
      }
      setCsvData(parsed);
      setStep('preview');
    } catch (err) {
      setError((err as Error).message);
    }
  }, []);

  const handleConfirmImport = useCallback(async () => {
    if (!file || !csvData) return;
    setError(null);
    setStep('processing');
    setProgress({ processed: 0, total: csvData.totalRows });

    // Simulate incremental progress (real progress comes when backend responds)
    const progressInterval = setInterval(() => {
      setProgress((prev) => ({
        ...prev,
        processed: Math.min(prev.processed + Math.ceil(csvData.totalRows * 0.05), csvData.totalRows - 1),
      }));
    }, 800);

    try {
      const importResult = await importCSV(file);
      clearInterval(progressInterval);
      setProgress({ processed: csvData.totalRows, total: csvData.totalRows });
      setResult(importResult);
      setStep('results');
    } catch (err) {
      clearInterval(progressInterval);
      setError((err as Error).message);
      setStep('preview');
    }
  }, [file, csvData]);

  const handleReset = useCallback(() => {
    setStep('upload');
    setFile(null);
    setCsvData(null);
    setResult(null);
    setError(null);
    setProgress({ processed: 0, total: 0 });
  }, []);

  const handleExport = useCallback(() => {
    if (result?.parsed) {
      exportToCSV(result.parsed, 'leadmorph-crm-export.csv');
    }
  }, [result]);

  return (
    <div className="app-wrapper">
      {/* Header */}
      <header className="header">
        <div className="container">
          <div className="header-inner">
            <div className="logo">
              <div className="logo-icon">⚡</div>
              <div>
                <div className="logo-text">LeadMorph AI</div>
                <div className="logo-subtitle">Intelligent CSV Importer</div>
              </div>
            </div>
            <div className="header-badge">🤖 Powered by Ollama LLM</div>
          </div>
        </div>
      </header>

      {/* Main */}
      <main className="container" style={{ paddingTop: 48, paddingBottom: 64, flex: 1 }}>
        {/* Hero */}
        <section className="hero">
          <div className="hero-tag">
            <span className="hero-dot" />
            GrowEasy CRM Importer
          </div>
          <h1 className="hero-title">
            Import Any CSV into{' '}
            <span className="hero-title-gradient">GrowEasy CRM</span>
            <br />
            with AI Precision
          </h1>
          <p className="hero-subtitle">
            Upload any CSV — Facebook Ads, Google Ads, real estate exports, sales reports — and
            our AI automatically maps every column to the correct CRM field.
          </p>
        </section>

        {/* Steps */}
        <div className="steps-bar">
          {[
            { num: 1, label: 'Upload CSV' },
            { num: 2, label: 'Preview' },
            { num: 3, label: 'AI Process' },
            { num: 4, label: 'Results' },
          ].map((s, i, arr) => (
            <div key={s.num} style={{ display: 'flex', alignItems: 'center' }}>
              <div className="step-item">
                <div
                  className={`step-number ${
                    currentStep > s.num
                      ? 'completed'
                      : currentStep === s.num
                      ? 'active'
                      : ''
                  }`}
                >
                  {currentStep > s.num ? '✓' : s.num}
                </div>
                <span
                  className={`step-label ${
                    currentStep > s.num
                      ? 'completed'
                      : currentStep === s.num
                      ? 'active'
                      : ''
                  }`}
                >
                  {s.label}
                </span>
              </div>
              {i < arr.length - 1 && (
                <div className={`step-connector${currentStep > s.num ? ' completed' : ''}`} />
              )}
            </div>
          ))}
        </div>

        {/* Error alert */}
        {error && (
          <div className="alert alert-error fade-in" style={{ marginBottom: 24 }}>
            <span style={{ fontSize: 20 }}>⚠️</span>
            <div>
              <strong>Error:</strong> {error}
              {error.includes('Ollama') && (
                <div style={{ marginTop: 8, fontSize: 13 }}>
                  💡 <strong>Fix:</strong> Make sure Ollama is running (
                  <code style={{ background: 'rgba(0,0,0,0.3)', padding: '2px 6px', borderRadius: 4 }}>
                    ollama serve
                  </code>
                  ) and the model is pulled (
                  <code style={{ background: 'rgba(0,0,0,0.3)', padding: '2px 6px', borderRadius: 4 }}>
                    ollama pull llama3.2
                  </code>
                  )
                </div>
              )}
            </div>
          </div>
        )}

        {/* ==================== STEP 1: Upload ==================== */}
        {step === 'upload' && (
          <div className="card slide-up">
            <h2 className="card-title">
              <span className="icon">📤</span> Upload Your CSV
            </h2>
            <p className="card-description">
              Drop any CSV file. Our AI handles different column names and formats automatically.
            </p>
            <DropZone onFileSelected={handleFileSelected} />

            <div
              style={{
                marginTop: 32,
                padding: '20px 24px',
                background: 'var(--bg-glass)',
                borderRadius: 'var(--radius-md)',
                border: '1px solid var(--border)',
              }}
            >
              <p style={{ fontSize: 13, color: 'var(--text-secondary)', marginBottom: 12, fontWeight: 600 }}>
                ✅ Supported CSV types:
              </p>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                {['Facebook Lead Export', 'Google Ads CSV', 'Excel Sheet', 'Real Estate CRM', 'Sales Report', 'Marketing Agency CSV', 'Custom Spreadsheet'].map((t) => (
                  <span key={t} className="badge badge-gray">{t}</span>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ==================== STEP 2: Preview ==================== */}
        {step === 'preview' && csvData && (
          <div className="card slide-up">
            <h2 className="card-title">
              <span className="icon">👁️</span> Preview Your Data
            </h2>
            <p className="card-description">
              Review the raw CSV data below. Click <strong>Confirm Import</strong> to let AI map
              your columns to CRM fields.
            </p>

            <PreviewTable headers={csvData.headers} rows={csvData.rows} />

            <div
              className="alert alert-info"
              style={{ marginTop: 24 }}
            >
              <span>🤖</span>
              <span>
                <strong>{csvData.totalRows} rows</strong> detected with{' '}
                <strong>{csvData.headers.length} columns</strong>. AI will intelligently map:{' '}
                <em>{csvData.headers.slice(0, 4).join(', ')}{csvData.headers.length > 4 ? '...' : ''}</em>
              </span>
            </div>

            <div className="action-row">
              <button
                id="confirm-import-btn"
                className="btn btn-success btn-lg"
                onClick={handleConfirmImport}
              >
                🚀 Confirm & Import with AI
              </button>
              <button className="btn btn-danger" onClick={handleReset}>
                ✕ Start Over
              </button>
            </div>
          </div>
        )}

        {/* ==================== STEP 3: Processing ==================== */}
        {step === 'processing' && (
          <div className="card slide-up" style={{ textAlign: 'center' }}>
            <h2 className="card-title" style={{ justifyContent: 'center' }}>
              <span className="icon">🧠</span> AI is Processing Your CSV
            </h2>
            <p className="card-description">
              Our LLM is intelligently mapping your columns to GrowEasy CRM fields in batches.
              This may take a moment depending on file size.
            </p>
            <ProgressBar
              processed={progress.processed}
              total={progress.total}
            />
          </div>
        )}

        {/* ==================== STEP 4: Results ==================== */}
        {step === 'results' && result && (
          <div className="slide-up">
            {/* Stats */}
            <div className="stats-grid" style={{ marginBottom: 32 }}>
              <div className="stat-card blue">
                <div className="stat-value blue">{result.total}</div>
                <div className="stat-label">Total Rows</div>
              </div>
              <div className="stat-card green">
                <div className="stat-value green">{result.parsed.length}</div>
                <div className="stat-label">Successfully Imported</div>
              </div>
              <div className="stat-card red">
                <div className="stat-value red">{result.skipped}</div>
                <div className="stat-label">Skipped Records</div>
              </div>
              <div className="stat-card purple">
                <div className="stat-value purple">
                  {result.total > 0
                    ? Math.round((result.parsed.length / result.total) * 100)
                    : 0}%
                </div>
                <div className="stat-label">Success Rate</div>
              </div>
            </div>

            {/* Results table */}
            <div className="card">
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'flex-start',
                  marginBottom: 20,
                  flexWrap: 'wrap',
                  gap: 12,
                }}
              >
                <div>
                  <h2 className="card-title">
                    <span className="icon">📊</span> CRM Records
                  </h2>
                  <p className="card-description" style={{ marginBottom: 0 }}>
                    AI-extracted leads ready for GrowEasy CRM import.
                  </p>
                </div>
                <div className="action-row" style={{ marginTop: 0 }}>
                  <button
                    id="export-csv-btn"
                    className="btn btn-success"
                    onClick={handleExport}
                    disabled={result.parsed.length === 0}
                  >
                    ⬇️ Export CSV
                  </button>
                  <button className="btn btn-secondary" onClick={handleReset}>
                    🔄 Import Another
                  </button>
                </div>
              </div>

              <ResultTable
                parsed={result.parsed}
                skippedRecords={result.skippedRecords}
              />
            </div>
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="footer">
        <div className="container">
          Built for GrowEasy · LeadMorph AI · Powered by Ollama &amp; Llama 3.2
        </div>
      </footer>
    </div>
  );
}
