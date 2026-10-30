import type { AuditRepository } from '@synaptria/audit';
import type { MilestoneRepository } from '@synaptria/domain/milestones';
import type { ProjectRepository } from '@synaptria/domain/projects';
import type { EventRepository } from '@synaptria/events';

/** Repositories that must participate in one atomic milestone transaction. */
export interface MilestoneTransactionRepositories {
  readonly milestones: MilestoneRepository;
  readonly projects: ProjectRepository;
  readonly audit: AuditRepository;
  readonly events: EventRepository;
}

/**
 * Application-facing transaction boundary.
 *
 * Infrastructure supplies the implementation. The application layer does not
 * depend on Prisma or any other persistence technology.
 */
export interface MilestoneUnitOfWork {
  execute<T>(
    operation: (repositories: MilestoneTransactionRepositories) => Promise<T>,
  ): Promise<T>;
}
