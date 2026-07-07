'use client';

import { useState, useCallback } from 'react';
import { parseCSVFile, ParsedCSV, formatFileSize } from '@/lib/csvParser';
import { importCSV, exportToCSV, ImportResult, CrmRecord } from '@/lib/api';
import { useDropzone } from 'react-dropzone';
import { List } from 'react-window';
import { AutoSizer } from 'react-virtualized-auto-sizer';

// ─── Sample CSV template data ───────────────────────────────────────────────
const SAMPLE_CSV = `created_at,name,email,country_code,mobile_without_country_code,company,city,state,country,lead_owner,crm_status,crm_note,data_source,possession_time,description
2026-05-13 14:20:48,John Doe,john.doe@example.com,+91,9876543210,GrowEasy,Mumbai,Maharashtra,India,owner@example.com,GOOD_LEAD_FOLLOW_UP,Client asked to reschedule demo,leads_on_demand,,
2026-05-13 14:25:30,Sarah Johnson,sarah.johnson@example.com,+91,9876543211,Tech Solutions,Bangalore,Karnataka,India,owner@example.com,DID_NOT_CONNECT,Person was busy,,,
`;

function downloadSampleCSV() {
  const blob = new Blob([SAMPLE_CSV], { type: 'text/csv' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'sample-crm-template.csv';
  a.click();
  URL.revokeObjectURL(url);
}

// ─── Status helpers ──────────────────────────────────────────────────────────
const STATUS_MAP: Record<string, { label: string; cls: string }> = {
  GOOD_LEAD_FOLLOW_UP: { label: 'Good Lead', cls: 'badge-good' },
  SALE_DONE:           { label: 'Sale Done', cls: 'badge-sale' },
  DID_NOT_CONNECT:     { label: 'Not Dialed', cls: 'badge-no-connect' },
  BAD_LEAD:            { label: 'Bad Lead',  cls: 'badge-bad'  },
};

// ─── Sidebar nav ─────────────────────────────────────────────────────────────
const NAV_ITEMS = [
  { icon: '☰', label: 'Manage Leads' },
];

// ─── Component ───────────────────────────────────────────────────────────────
type ModalStep = 'upload' | 'preview' | 'processing' | 'done';

export default function HomePage() {
  const [activeNav, setActiveNav] = useState('Manage Leads');
  const [modalOpen, setModalOpen] = useState(false);
  const [modalStep, setModalStep] = useState<ModalStep>('upload');

  const [file, setFile] = useState<File | null>(null);
  const [csvData, setCsvData] = useState<ParsedCSV | null>(null);
  const [result, setResult] = useState<ImportResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [progress, setProgress] = useState(0);
  const [searchQuery, setSearchQuery] = useState('');
  const [visibleCount, setVisibleCount] = useState(10);

  // Dropzone
  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    if (!acceptedFiles.length) return;
    const f = acceptedFiles[0];
    setFile(f);
    setError(null);
    try {
      const parsed = await parseCSVFile(f);
      setCsvData(parsed);
      setModalStep('preview');
    } catch (e) {
      setError((e as Error).message);
    }
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { 'text/csv': ['.csv'], 'application/vnd.ms-excel': ['.csv'] },
    maxFiles: 1,
    disabled: modalStep !== 'upload',
  });

  const handleOpenModal = () => {
    setModalStep('upload');
    setFile(null);
    setCsvData(null);
    setError(null);
    setProgress(0);
    setModalOpen(true);
  };

  const handleCloseModal = () => setModalOpen(false);

  const handleRemoveFile = () => {
    setFile(null);
    setCsvData(null);
    setModalStep('upload');
  };

  const handleUpload = () => {
    if (!file) return;
    setError(null);
    setModalStep('processing');
    setProgress(0);

    const initialResult: ImportResult = { parsed: [], skipped: 0, total: csvData?.rows.length || 0, skippedRecords: [] };
    setResult(initialResult);

    importCSV(file, {
      onBatch: (parsedChunk, skippedChunk, processed, total) => {
        setResult(prev => {
          if (!prev) return prev;
          return {
            parsed: [...prev.parsed, ...parsedChunk],
            skipped: prev.skipped + skippedChunk.length,
            total,
            skippedRecords: [...prev.skippedRecords, ...skippedChunk]
          };
        });
        setProgress(Math.round((processed / total) * 100));
      },
      onDone: () => {
        setProgress(100);
        setVisibleCount(10);
        setTimeout(() => {
          setModalOpen(false);
          setModalStep('upload');
        }, 600);
      },
      onError: (errMsg) => {
        setError(errMsg);
        setModalStep('preview');
      }
    });
  };

  // Lead filtering + pagination
  const leads: CrmRecord[] = result?.parsed ?? [];
  const filtered = leads.filter((l) => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return (
      l.email.toLowerCase().includes(q) ||
      l.mobile_without_country_code.includes(q) ||
      l.name.toLowerCase().includes(q)
    );
  });
  const visible = filtered.slice(0, visibleCount);

  return (
    <div className="app-layout">
      {/* ── SIDEBAR ── */}
      <aside className="sidebar">
        <div className="sidebar-logo">
          <div className="logo-box">G</div>
          <span className="logo-name">GrowEasy</span>
        </div>

        <div className="sidebar-user">
          <div className="user-avatar">H</div>
          <div className="user-info">
            <div className="user-name">Harsh Karn</div>
            <div className="user-role">Owner</div>
          </div>
          <span className="sidebar-chevron">›</span>
        </div>

        <nav style={{ padding: '12px 0' }}>
            {NAV_ITEMS.map((item) => (
              <div
                key={item.label}
                className={`nav-item${activeNav === item.label ? ' active' : ''}`}
                onClick={() => setActiveNav(item.label)}
              >
                <span className="nav-icon">{item.icon}</span>
                {item.label}
              </div>
            ))}
          </nav>
          <div style={{ flex: 1 }} />
          <div 
            className="nav-item" 
            style={{ marginBottom: 20, justifyContent: 'center' }}
            onClick={() => {
              document.body.classList.toggle('dark');
            }}
          >
            <span className="nav-icon">🌗</span>
            Toggle Dark Mode
          </div>
        </aside>

      {/* ── MAIN ── */}

      <div className="main-content">
        {/* Page header */}
        <div className="page-header">
          <div>
            <div className="page-title">Manage Your Leads</div>
            <div className="page-subtitle">Monitor lead status, assign tasks, and close deals faster.</div>
          </div>
          <button id="import-csv-btn" className="import-btn" onClick={handleOpenModal}>
            ⬆ Import CSV
          </button>
        </div>

        <div className="page-body">
          {/* Stats row */}
          {result && (
            <div className="stats-row fade-in">
              <div className="stat-card primary">
                <div className="stat-value">{result.total}</div>
                <div className="stat-label">Total Rows</div>
              </div>
              <div className="stat-card success">
                <div className="stat-value">{result.parsed.length}</div>
                <div className="stat-label">Imported</div>
              </div>
              <div className="stat-card danger">
                <div className="stat-value">{result.skipped}</div>
                <div className="stat-label">Skipped</div>
              </div>
              <div className="stat-card warning">
                <div className="stat-value">
                  {result.total > 0
                    ? Math.round((result.parsed.length / result.total) * 100)
                    : 0}%
                </div>
                <div className="stat-label">Success Rate</div>
              </div>
            </div>
          )}

          {/* Leads table */}
          <div className="leads-header">
            <div className="leads-title">Your Leads</div>
            <div className="search-row">
              <div className="search-input-wrap">
                <input
                  id="lead-search"
                  className="search-input"
                  placeholder="Enter email or phone number..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
                <button className="search-icon-btn">🔍</button>
              </div>
              <button
                className="refresh-btn"
                title="Refresh"
                onClick={() => setSearchQuery('')}
              >
                ↻
              </button>
              {result && (
                <button
                  className="btn btn-outline"
                  style={{ fontSize: 13, padding: '8px 16px' }}
                  onClick={() => exportToCSV(result.parsed)}
                >
                  ⬇ Export
                </button>
              )}
            </div>
          </div>

          {leads.length === 0 ? (
            <div className="table-card">
              <div className="empty-state">
                <div className="empty-icon">📋</div>
                <div className="empty-title">No leads yet</div>
                <div className="empty-sub">
                  Click <strong>Import CSV</strong> to upload and process your leads.
                </div>
              </div>
            </div>
          ) : (
            <div className="table-card fade-in" style={{ height: '600px', display: 'flex', flexDirection: 'column' }}>
              <div className="table-header-row" style={{ display: 'flex', borderBottom: '1px solid var(--border-color, #e5e7eb)', padding: '12px 16px', fontWeight: 500, fontSize: '13px', color: 'var(--text-color, #6b7280)' }}>
                <div style={{ flex: '1.5' }}>Lead Name</div>
                <div style={{ flex: '2' }}>Email</div>
                <div style={{ flex: '1.5' }}>Contact</div>
                <div style={{ flex: '1' }}>Date Created</div>
                <div style={{ flex: '1.5' }}>Company</div>
                <div style={{ flex: '1' }}>Status</div>
                <div style={{ flex: '1' }}>Lead Owner</div>
                <div style={{ flex: '0.5', textAlign: 'right' }}>Actions</div>
              </div>
              <div style={{ flex: 1 }}>
                {/* @ts-ignore - types are out of date for named export */}
                <AutoSizer>
                  {({ height, width }: { height: number; width: number }) => {
                    const AnyList = List as any;
                    return (
                    <AnyList
                      height={height}
                      itemCount={filtered.length}
                      itemSize={60}
                      width={width}
                      itemData={filtered}
                    >
                      {({ index, style, data }: { index: number; style: any; data: any }) => {
                        const lead = data[index];
                        const status = STATUS_MAP[lead.crm_status] ?? { label: lead.crm_status || '—', cls: 'badge-gray' };
                        const phone = lead.mobile_without_country_code
                          ? `${lead.country_code || '+'}${lead.mobile_without_country_code}`
                          : '—';
                        const dateStr = lead.created_at
                          ? new Date(lead.created_at).toLocaleDateString('en-US', {
                              month: 'short', day: 'numeric', year: 'numeric',
                            })
                          : '—';

                        return (
                          <div style={{ ...style, display: 'flex', alignItems: 'center', padding: '0 16px', borderBottom: '1px solid var(--border-color, #f3f4f6)', fontSize: '14px' }}>
                            <div style={{ flex: '1.5', fontWeight: 500 }}>{lead.name || '—'}</div>
                            <div style={{ flex: '2', color: '#4f7cff' }}>{lead.email || <span className="td-muted">—</span>}</div>
                            <div style={{ flex: '1.5' }}>{phone}</div>
                            <div style={{ flex: '1', color: '#6b7280', fontSize: '13px' }}>{dateStr}</div>
                            <div style={{ flex: '1.5' }}>{lead.company || <span className="td-muted">—</span>}</div>
                            <div style={{ flex: '1' }}>
                              {lead.crm_status ? (
                                <span className={`badge ${status.cls}`}>{status.label}</span>
                              ) : (
                                <span className="td-muted">—</span>
                              )}
                            </div>
                            <div style={{ flex: '1', color: '#6b7280' }}>{lead.lead_owner || '—'}</div>
                            <div style={{ flex: '0.5', textAlign: 'right' }}>
                              <button className="actions-btn">More ›</button>
                            </div>
                          </div>
                        );
                      }}
                    </AnyList>
                    );
                  }}
                </AutoSizer>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ── MODAL ── */}
      {modalOpen && (
        <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && handleCloseModal()}>
          <div className="modal">
            <div className="modal-header">
              <div>
                <div className="modal-title">Import Leads via CSV</div>
                <div className="modal-subtitle">Upload a CSV file to bulk import leads into your system.</div>
              </div>
              <button className="modal-close" onClick={handleCloseModal} id="modal-close-btn">✕</button>
            </div>

            <div className="modal-body">
              {/* Error */}
              {error && (
                <div className="alert alert-error">
                  <span>⚠️</span>
                  <div>
                    <div>{error}</div>
                    {error.includes('Ollama') && (
                      <div style={{ marginTop: 6, fontSize: 12 }}>
                        Run: <code>ollama serve</code> and <code>ollama pull llama3.2</code>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* UPLOAD STEP */}
              {modalStep === 'upload' && (
                <div>
                  <div
                    {...getRootProps()}
                    className={`modal-dropzone${isDragActive ? ' dragging' : ''}`}
                    id="modal-dropzone"
                  >
                    <input {...getInputProps()} id="csv-file-input" />
                    <div className="upload-icon">↑</div>
                    <div className="dropzone-title">Drop your CSV file here</div>
                    <div className="dropzone-sub">or click to browse files</div>
                    <div className="file-chip">
                      <span>○</span> Supported file: .csv (max 5MB)
                    </div>
                    <div className="required-headers">
                      Required headers: created_at, name, email, country_code,
                      mobile_without_country_code, company, city, state, country, lead_owner,
                      crm_status, crm_note. Template includes default + custom CRM fields to reduce upload errors.
                    </div>
                    <button
                      type="button"
                      className="download-template"
                      onClick={(e) => { e.stopPropagation(); downloadSampleCSV(); }}
                    >
                      📄 Download Sample CSV Template
                    </button>
                  </div>
                </div>
              )}

              {/* PREVIEW STEP */}
              {modalStep === 'preview' && file && csvData && (
                <div>
                  {/* File info row */}
                  <div className="file-selected-row">
                    <div className="file-csv-icon">📄</div>
                    <div>
                      <div className="file-selected-name">{file.name}</div>
                      <div className="file-selected-size">{formatFileSize(file.size)}</div>
                    </div>
                    <button className="file-remove-btn" onClick={handleRemoveFile} title="Remove file">✕</button>
                  </div>

                  {/* Preview table */}
                  <div className="preview-table-wrap">
                    <table>
                      <thead>
                        <tr>
                          {csvData.headers.slice(0, 6).map((h) => (
                            <th key={h}>{h.toUpperCase()}</th>
                          ))}
                          {csvData.headers.length > 6 && (
                            <th>+{csvData.headers.length - 6} more</th>
                          )}
                        </tr>
                      </thead>
                      <tbody>
                        {csvData.rows.slice(0, 8).map((row, i) => (
                          <tr key={i}>
                            {csvData.headers.slice(0, 6).map((h) => (
                              <td key={h} title={row[h]}>
                                {row[h] || <span style={{ color: '#d1d5db' }}>—</span>}
                              </td>
                            ))}
                            {csvData.headers.length > 6 && <td />}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  {csvData.totalRows > 8 && (
                    <div style={{ fontSize: 12, color: '#9ca3af', marginTop: 8, textAlign: 'center' }}>
                      Showing 8 of {csvData.totalRows} rows
                    </div>
                  )}
                </div>
              )}

              {/* PROCESSING STEP */}
              {modalStep === 'processing' && (
                <div className="progress-section">
                  <div className="progress-dots">
                    <div className="progress-dot" />
                    <div className="progress-dot" />
                    <div className="progress-dot" />
                  </div>
                  <div className="progress-label">AI is processing your CSV...</div>
                  <div className="progress-track">
                    <div className="progress-fill" style={{ width: `${progress}%` }} />
                  </div>
                  <div className="progress-text">
                    Intelligently mapping columns... (Local AI processing depends on your computer's speed and may take a few minutes) — {Math.floor(progress)}%
                  </div>
                </div>
              )}
            </div>

            {/* Modal Footer */}
            {modalStep !== 'processing' && (
              <div className="modal-footer">
                <button id="modal-cancel-btn" className="btn btn-outline" onClick={handleCloseModal}>
                  Cancel
                </button>
                <button
                  id="modal-upload-btn"
                  className="btn btn-orange"
                  onClick={modalStep === 'upload' ? () => {
                    (document.getElementById('csv-file-input') as HTMLInputElement)?.click();
                  } : handleUpload}
                  disabled={modalStep === 'preview' && !file}
                >
                  {modalStep === 'upload' ? 'Upload File' : '🚀 Upload File'}
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
