import type { OrganizationId } from '@synaptria/core';
import type { OrganizationRole } from '@synaptria/core/context';
import type { Milestone, MilestoneRepository } from '@synaptria/domain/milestones';
import { PERMISSIONS, requirePermission } from '@synaptria/permissions';

export interface ListMilestonesContext {
  readonly organizationId: OrganizationId;
  readonly role: OrganizationRole;
}

export interface ListMilestonesOutput {
  readonly milestones: readonly Milestone[];
}

/**
 * Lists all milestones for the authenticated organization.
 *
 * The persistence adapter scopes this query by organizationId.
 */
export class ListMilestonesUseCase {
  constructor(private readonly milestones: MilestoneRepository) {}

  async execute(context: ListMilestonesContext): Promise<ListMilestonesOutput> {
    requirePermission(context.role, PERMISSIONS.MILESTONES_READ);

    const milestones = await this.milestones.listForOrganization(
      context.organizationId,
    );

    return {
      milestones: [...milestones].sort(compareMilestones),
    };
  }
}

function compareMilestones(left: Milestone, right: Milestone): number {
  return left.name.localeCompare(right.name, 'en', { sensitivity: 'base' });
}
