import type { AuditRepository } from '@synaptria/audit';
import type {
  MembershipRepository,
  OrganizationRepository,
} from '@synaptria/domain/organization';
import type { EventRepository } from '@synaptria/events';

/** Repositories that must participate in one atomic organization transaction. */
export interface OrganizationTransactionRepositories {
  readonly organizations: OrganizationRepository;
  readonly memberships: MembershipRepository;
  readonly audit: AuditRepository;
  readonly events: EventRepository;
}

/**
 * Application-facing transaction boundary.
 *
 * Infrastructure supplies the implementation. The application layer does not
 * depend on Prisma or any other persistence technology.
 */
export interface OrganizationUnitOfWork {
  execute<T>(
    operation: (
      repositories: OrganizationTransactionRepositories,
    ) => Promise<T>,
  ): Promise<T>;
}
