import type { AuditRepository } from '@synaptria/audit';
import type { MilestoneRepository } from '@synaptria/domain/milestones';
import type { TaskRepository } from '@synaptria/domain/tasks';
import type { EventRepository } from '@synaptria/events';

/** Repositories that must participate in one atomic task transaction. */
export interface TaskTransactionRepositories {
  readonly tasks: TaskRepository;
  readonly milestones: MilestoneRepository;
  readonly audit: AuditRepository;
  readonly events: EventRepository;
}

/**
 * Application-facing transaction boundary.
 *
 * Infrastructure supplies the implementation. The application layer does not
 * depend on Prisma or any other persistence technology.
 */
export interface TaskUnitOfWork {
  execute<T>(
    operation: (repositories: TaskTransactionRepositories) => Promise<T>,
  ): Promise<T>;
}
