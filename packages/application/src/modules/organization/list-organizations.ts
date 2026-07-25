import type { OrganizationId, UserId } from '@synaptria/core';
import type {
  Organization,
  OrganizationMembership,
  OrganizationRepository,
  OrganizationSummary,
} from '@synaptria/domain/organization';

export interface ListOrganizationsContext {
  readonly userId: UserId;
  readonly activeOrganizationId?: OrganizationId;
}

export interface OrganizationListItem {
  readonly organization: Organization;
  readonly membership: OrganizationMembership;
  readonly isActive: boolean;
}

export interface ListOrganizationsOutput {
  readonly organizations: readonly OrganizationListItem[];
  readonly activeOrganizationId?: OrganizationId;
}

/**
 * Lists organizations that the authenticated user may actively access.
 *
 * The persistence adapter already scopes this query to active memberships and
 * non-deleted organizations. The application layer repeats those checks so a
 * different repository implementation cannot accidentally expose inaccessible
 * tenants.
 */
export class ListOrganizationsUseCase {
  constructor(
    private readonly organizations: OrganizationRepository,
  ) {}

  async execute(
    context: ListOrganizationsContext,
  ): Promise<ListOrganizationsOutput> {
    const summaries = await this.organizations.listForUser(context.userId);
    const accessible = summaries
      .filter(isAccessibleSummary)
      .sort(compareOrganizationSummaries);

    const activeOrganizationId = resolveActiveOrganizationId(
      accessible,
      context.activeOrganizationId,
    );

    return {
      organizations: accessible.map((summary) => ({
        organization: summary.organization,
        membership: summary.membership,
        isActive: summary.organization.id === activeOrganizationId,
      })),
      ...(activeOrganizationId === undefined
        ? {}
        : { activeOrganizationId }),
    };
  }
}

function isAccessibleSummary(summary: OrganizationSummary): boolean {
  return (
    summary.membership.status === 'ACTIVE' &&
    summary.organization.deletedAt === undefined
  );
}

function compareOrganizationSummaries(
  left: OrganizationSummary,
  right: OrganizationSummary,
): number {
  const nameComparison = left.organization.name.localeCompare(
    right.organization.name,
    'en',
    { sensitivity: 'base' },
  );

  if (nameComparison !== 0) {
    return nameComparison;
  }

  return left.organization.slug.localeCompare(right.organization.slug, 'en', {
    sensitivity: 'base',
  });
}

function resolveActiveOrganizationId(
  summaries: readonly OrganizationSummary[],
  requestedId: OrganizationId | undefined,
): OrganizationId | undefined {
  if (
    requestedId !== undefined &&
    summaries.some((summary) => summary.organization.id === requestedId)
  ) {
    return requestedId;
  }

  return summaries[0]?.organization.id;
}
