import type { MilestoneId, OrganizationId } from '@synaptria/core';
import type { OrganizationRole } from '@synaptria/core/context';
import type { Milestone, MilestoneRepository } from '@synaptria/domain/milestones';
import { PERMISSIONS, requirePermission } from '@synaptria/permissions';

import { ApplicationError } from '../../shared/application-error';

export interface GetMilestoneContext {
  readonly organizationId: OrganizationId;
  readonly role: OrganizationRole;
}

export interface GetMilestoneInput {
  readonly milestoneId: MilestoneId;
}

export interface GetMilestoneOutput {
  readonly milestone: Milestone;
}

/**
 * Fetches one milestone within the authenticated organization.
 *
 * Returns not found when the milestone is missing or belongs to another
 * organization.
 */
export class GetMilestoneUseCase {
  constructor(private readonly milestones: MilestoneRepository) {}

  async execute(
    context: GetMilestoneContext,
    input: GetMilestoneInput,
  ): Promise<GetMilestoneOutput> {
    requirePermission(context.role, PERMISSIONS.MILESTONES_READ);

    const milestone = await this.milestones.findById(
      context.organizationId,
      input.milestoneId,
    );

    if (milestone === null) {
      throw new ApplicationError({
        code: 'NOT_FOUND',
        message: 'The requested milestone was not found.',
        details: { milestoneId: input.milestoneId },
      });
    }

    return { milestone };
  }
}
