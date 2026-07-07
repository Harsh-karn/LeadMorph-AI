'use client';

interface ProgressBarProps {
  processed: number;
  total: number;
  label?: string;
}

export default function ProgressBar({ processed, total, label }: ProgressBarProps) {
  const pct = total > 0 ? Math.round((processed / total) * 100) : 0;

  return (
    <div className="progress-wrapper fade-in">
      <div className="progress-header">
        <span className="progress-label">
          {label || '🤖 AI Processing rows...'}
        </span>
        <span className="progress-count">
          {processed} / {total} rows ({pct}%)
        </span>
      </div>
      <div className="progress-bar-track">
        <div className="progress-bar-fill" style={{ width: `${pct}%` }} />
      </div>
      <div className="processing-dots" style={{ marginTop: 10 }}>
        <div className="processing-dot" />
        <div className="processing-dot" />
        <div className="processing-dot" />
        <span style={{ fontSize: 12, color: 'var(--text-muted)', marginLeft: 6 }}>
          Intelligently mapping columns to CRM fields...
        </span>
      </div>
    </div>
  );
}
