import { validateAndClean } from '../src/services/crmMapper';
import { CrmRecord } from '../src/types/crm';

describe('CRM Mapper Validation', () => {
  it('should invalidate records missing both email and mobile', () => {
    const input: Partial<CrmRecord> = {
      name: 'John Doe',
      company: 'Test Corp'
    };
    
    const result = validateAndClean(input);
    expect(result.valid).toBe(false);
    expect(result.reason).toContain('Missing both email and mobile');
  });

  it('should validate records with only email', () => {
    const input: Partial<CrmRecord> = {
      name: 'John Doe',
      email: 'john@example.com'
    };
    
    const result = validateAndClean(input);
    expect(result.valid).toBe(true);
    expect(result.record.email).toBe('john@example.com');
  });

  it('should validate records with only mobile', () => {
    const input: Partial<CrmRecord> = {
      name: 'John Doe',
      mobile_without_country_code: '9876543210'
    };
    
    const result = validateAndClean(input);
    expect(result.valid).toBe(true);
    expect(result.record.mobile_without_country_code).toBe('9876543210');
  });

  it('should strictly enforce allowed CRM statuses', () => {
    const input: Partial<CrmRecord> = {
      email: 'test@test.com',
      crm_status: 'RANDOM_STATUS' as any // Invalid status
    };
    
    const result = validateAndClean(input);
    expect(result.valid).toBe(true); // Still valid because we just clear the status
    expect(result.record.crm_status).toBe('');
  });

  it('should allow valid CRM statuses', () => {
    const input: Partial<CrmRecord> = {
      email: 'test@test.com',
      crm_status: 'SALE_DONE'
    };
    
    const result = validateAndClean(input);
    expect(result.valid).toBe(true);
    expect(result.record.crm_status).toBe('SALE_DONE');
  });
});
