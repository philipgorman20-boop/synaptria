import type { AuditRepository } from '@synaptria/audit';
import type { DecisionRepository } from '@synaptria/domain/decisions';
import type { EventRepository } from '@synaptria/events';

export interface DecisionTransactionRepositories {
  readonly decisions: DecisionRepository;
  readonly audit: AuditRepository;
  readonly events: EventRepository;
}

export interface DecisionUnitOfWork {
  execute<T>(
    operation: (repositories: DecisionTransactionRepositories) => Promise<T>,
  ): Promise<T>;
}
