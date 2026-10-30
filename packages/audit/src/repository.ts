import type { AuditEventRecord, RecordAuditEventInput } from './types';

export interface AuditRepository {
  create(input: RecordAuditEventInput): Promise<AuditEventRecord>;
}
