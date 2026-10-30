import type { AuditRepository } from '@synaptria/audit';
import type { ProgramRepository } from '@synaptria/domain/programs';
import type { EventRepository } from '@synaptria/events';

/** Repositories that must participate in one atomic program transaction. */
export interface ProgramTransactionRepositories {
  readonly programs: ProgramRepository;
  readonly audit: AuditRepository;
  readonly events: EventRepository;
}

/**
 * Application-facing transaction boundary.
 *
 * Infrastructure supplies the implementation. The application layer does not
 * depend on Prisma or any other persistence technology.
 */
export interface ProgramUnitOfWork {
  execute<T>(
    operation: (repositories: ProgramTransactionRepositories) => Promise<T>,
  ): Promise<T>;
}
