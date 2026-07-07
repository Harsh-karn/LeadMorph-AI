'use client';

interface PreviewTableProps {
  headers: string[];
  rows: Record<string, string>[];
}

const MAX_PREVIEW_ROWS = 100;

export default function PreviewTable({ headers, rows }: PreviewTableProps) {
  const previewRows = rows.slice(0, MAX_PREVIEW_ROWS);
  const hasMore = rows.length > MAX_PREVIEW_ROWS;

  if (headers.length === 0) return null;

  return (
    <div>
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '12px',
        }}
      >
        <span style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>
          Showing <strong style={{ color: 'var(--text-primary)' }}>{previewRows.length}</strong>{' '}
          of <strong style={{ color: 'var(--text-primary)' }}>{rows.length}</strong> rows
          &nbsp;·&nbsp;
          <strong style={{ color: 'var(--text-primary)' }}>{headers.length}</strong> columns
        </span>
        {hasMore && (
          <span
            style={{
              fontSize: '12px',
              color: 'var(--accent-yellow)',
              background: 'rgba(245,158,11,0.1)',
              padding: '3px 10px',
              borderRadius: '100px',
              border: '1px solid rgba(245,158,11,0.2)',
            }}
          >
            ⚡ First {MAX_PREVIEW_ROWS} rows shown
          </span>
        )}
      </div>

      <div className="table-wrapper">
        <div className="table-scroll">
          <table>
            <thead>
              <tr>
                <th style={{ width: 40, minWidth: 40 }}>#</th>
                {headers.map((h) => (
                  <th key={h}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {previewRows.map((row, idx) => (
                <tr key={idx}>
                  <td style={{ color: 'var(--text-muted)', fontVariantNumeric: 'tabular-nums' }}>
                    {idx + 1}
                  </td>
                  {headers.map((h) => (
                    <td key={h} title={row[h]}>
                      {row[h] || (
                        <span style={{ color: 'var(--text-muted)', fontStyle: 'italic' }}>
                          —
                        </span>
                      )}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
