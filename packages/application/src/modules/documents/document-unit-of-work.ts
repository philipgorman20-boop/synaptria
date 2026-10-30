import type { AuditRepository } from '@synaptria/audit';
import type { DocumentRepository } from '@synaptria/domain/documents';
import type { EventRepository } from '@synaptria/events';

export interface DocumentTransactionRepositories {
  readonly documents: DocumentRepository;
  readonly audit: AuditRepository;
  readonly events: EventRepository;
}

export interface DocumentUnitOfWork {
  execute<T>(
    operation: (repositories: DocumentTransactionRepositories) => Promise<T>,
  ): Promise<T>;
}
