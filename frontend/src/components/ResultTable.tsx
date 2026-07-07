'use client';

import { useState } from 'react';
import { CrmRecord, SkippedRecord } from '@/lib/api';

interface ResultTableProps {
  parsed: CrmRecord[];
  skippedRecords: SkippedRecord[];
}

const CRM_HEADERS: { key: keyof CrmRecord; label: string }[] = [
  { key: 'name', label: 'Name' },
  { key: 'email', label: 'Email' },
  { key: 'mobile_without_country_code', label: 'Mobile' },
  { key: 'country_code', label: 'Code' },
  { key: 'company', label: 'Company' },
  { key: 'city', label: 'City' },
  { key: 'state', label: 'State' },
  { key: 'country', label: 'Country' },
  { key: 'crm_status', label: 'Status' },
  { key: 'data_source', label: 'Source' },
  { key: 'lead_owner', label: 'Owner' },
  { key: 'created_at', label: 'Created' },
  { key: 'crm_note', label: 'Notes' },
  { key: 'description', label: 'Description' },
];

const STATUS_BADGE: Record<string, string> = {
  GOOD_LEAD_FOLLOW_UP: 'badge-green',
  SALE_DONE: 'badge-blue',
  DID_NOT_CONNECT: 'badge-yellow',
  BAD_LEAD: 'badge-red',
};

const STATUS_LABEL: Record<string, string> = {
  GOOD_LEAD_FOLLOW_UP: '✅ Follow Up',
  SALE_DONE: '🏆 Sale Done',
  DID_NOT_CONNECT: '📞 No Connect',
  BAD_LEAD: '❌ Bad Lead',
};

export default function ResultTable({ parsed, skippedRecords }: ResultTableProps) {
  const [activeTab, setActiveTab] = useState<'parsed' | 'skipped'>('parsed');

  return (
    <div className="fade-in">
      <div className="tabs">
        <button
          id="tab-parsed"
          className={`tab${activeTab === 'parsed' ? ' active' : ''}`}
          onClick={() => setActiveTab('parsed')}
        >
          ✅ Parsed ({parsed.length})
        </button>
        <button
          id="tab-skipped"
          className={`tab${activeTab === 'skipped' ? ' active' : ''}`}
          onClick={() => setActiveTab('skipped')}
        >
          ⚠️ Skipped ({skippedRecords.length})
        </button>
      </div>

      {activeTab === 'parsed' && (
        <>
          {parsed.length === 0 ? (
            <div className="empty-state">
              <span className="empty-state-icon">🤷</span>
              <p>No records were successfully parsed.</p>
            </div>
          ) : (
            <div className="table-wrapper">
              <div className="table-scroll">
                <table>
                  <thead>
                    <tr>
                      <th>#</th>
                      {CRM_HEADERS.map((h) => (
                        <th key={h.key}>{h.label}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {parsed.map((record, idx) => (
                      <tr key={idx}>
                        <td style={{ color: 'var(--text-muted)' }}>{idx + 1}</td>
                        {CRM_HEADERS.map((h) => {
                          const val = record[h.key];
                          if (h.key === 'crm_status' && val) {
                            return (
                              <td key={h.key}>
                                <span className={`badge ${STATUS_BADGE[val] || 'badge-gray'}`}>
                                  {STATUS_LABEL[val] || val}
                                </span>
                              </td>
                            );
                          }
                          if (h.key === 'data_source' && val) {
                            return (
                              <td key={h.key}>
                                <span className="badge badge-blue">{val}</span>
                              </td>
                            );
                          }
                          return (
                            <td key={h.key} title={val}>
                              {val || (
                                <span style={{ color: 'var(--text-muted)', fontStyle: 'italic' }}>
                                  —
                                </span>
                              )}
                            </td>
                          );
                        })}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </>
      )}

      {activeTab === 'skipped' && (
        <>
          {skippedRecords.length === 0 ? (
            <div className="empty-state">
              <span className="empty-state-icon">🎉</span>
              <p>No records were skipped. Perfect import!</p>
            </div>
          ) : (
            <div className="table-wrapper">
              <div className="table-scroll">
                <table>
                  <thead>
                    <tr>
                      <th>#</th>
                      <th>Reason</th>
                      <th>Row Data</th>
                    </tr>
                  </thead>
                  <tbody>
                    {skippedRecords.map((s, idx) => (
                      <tr key={idx}>
                        <td style={{ color: 'var(--text-muted)' }}>{idx + 1}</td>
                        <td>
                          <span className="badge badge-red">{s.reason}</span>
                        </td>
                        <td style={{ maxWidth: 400, color: 'var(--text-secondary)', fontSize: 12 }}>
                          {JSON.stringify(s.row).slice(0, 120)}...
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
