import type { AuditRepository } from '@synaptria/audit';
import type { ProgramRepository } from '@synaptria/domain/programs';
import type { ProjectRepository } from '@synaptria/domain/projects';
import type { EventRepository } from '@synaptria/events';

/** Repositories that must participate in one atomic project transaction. */
export interface ProjectTransactionRepositories {
  readonly projects: ProjectRepository;
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
export interface ProjectUnitOfWork {
  execute<T>(
    operation: (repositories: ProjectTransactionRepositories) => Promise<T>,
  ): Promise<T>;
}
