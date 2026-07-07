import {
  CrmRecord,
  ALLOWED_CRM_STATUSES,
  ALLOWED_DATA_SOURCES,
  CrmStatus,
  DataSource,
} from '../types/crm';

/**
 * Validates and cleans a single CRM record after AI extraction.
 * Enforces enum constraints, date format, and skip rules.
 */
export function validateAndClean(
  raw: Partial<CrmRecord>
): { record: CrmRecord; valid: boolean; reason?: string } {
  const email = (raw.email || '').trim();
  const mobile = (raw.mobile_without_country_code || '').trim();

  // Skip rule: must have email OR mobile
  if (!email && !mobile) {
    return {
      record: raw as CrmRecord,
      valid: false,
      reason: 'Missing both email and mobile number',
    };
  }

  // Validate / coerce crm_status
  const rawStatus = (raw.crm_status || '').trim().toUpperCase() as CrmStatus;
  const crmStatus: CrmStatus | '' = ALLOWED_CRM_STATUSES.includes(rawStatus)
    ? rawStatus
    : '';

  // Validate / coerce data_source
  const rawSource = (raw.data_source || '').trim().toLowerCase() as DataSource;
  const dataSource: DataSource | '' = ALLOWED_DATA_SOURCES.includes(rawSource)
    ? rawSource
    : '';

  // Validate / coerce created_at — must be parseable by new Date()
  let createdAt = (raw.created_at || '').trim();
  if (createdAt && isNaN(new Date(createdAt).getTime())) {
    createdAt = ''; // Reset if invalid
  }

  const record: CrmRecord = {
    created_at: createdAt,
    name: (raw.name || '').trim(),
    email,
    country_code: (raw.country_code || '').trim(),
    mobile_without_country_code: mobile,
    company: (raw.company || '').trim(),
    city: (raw.city || '').trim(),
    state: (raw.state || '').trim(),
    country: (raw.country || '').trim(),
    lead_owner: (raw.lead_owner || '').trim(),
    crm_status: crmStatus,
    crm_note: (raw.crm_note || '').trim(),
    data_source: dataSource,
    possession_time: (raw.possession_time || '').trim(),
    description: (raw.description || '').trim(),
  };

  return { record, valid: true };
}
