import type { AuditRepository } from '@synaptria/audit';
import type { ActionExecutionRequestRepository } from '@synaptria/domain/action-executions';
import type { EventRepository } from '@synaptria/events';

/** Repositories that must participate in one atomic action execution transaction. */
export interface ActionExecutionTransactionRepositories {
  readonly actionExecutionRequests: ActionExecutionRequestRepository;
  readonly audit: AuditRepository;
  readonly events: EventRepository;
}

/** Application-facing transaction boundary for action execution authorization mutations. */
export interface ActionExecutionUnitOfWork {
  execute<T>(
    operation: (repositories: ActionExecutionTransactionRepositories) => Promise<T>,
  ): Promise<T>;
}
