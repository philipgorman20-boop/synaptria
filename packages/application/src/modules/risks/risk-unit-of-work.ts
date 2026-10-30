import type { AuditRepository } from '@synaptria/audit';
import type { RiskRepository } from '@synaptria/domain/risks';
import type { EventRepository } from '@synaptria/events';

export interface RiskTransactionRepositories {
  readonly risks: RiskRepository;
  readonly audit: AuditRepository;
  readonly events: EventRepository;
}

export interface RiskUnitOfWork {
  execute<T>(
    operation: (repositories: RiskTransactionRepositories) => Promise<T>,
  ): Promise<T>;
}
