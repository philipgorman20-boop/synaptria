import type { OrganizationId, ProjectId } from '@synaptria/core';
import type { OrganizationRole } from '@synaptria/core/context';
import type { Milestone, MilestoneRepository } from '@synaptria/domain/milestones';
import type { ProjectRepository } from '@synaptria/domain/projects';
import { PERMISSIONS, requirePermission } from '@synaptria/permissions';

import { ApplicationError } from '../../shared/application-error';

export interface ListProjectMilestonesContext {
  readonly organizationId: OrganizationId;
  readonly role: OrganizationRole;
}

export interface ListProjectMilestonesInput {
  readonly projectId: ProjectId;
}

export interface ListProjectMilestonesOutput {
  readonly milestones: readonly Milestone[];
}

/**
 * Lists milestones for one project within the authenticated organization.
 *
 * Verifies the parent project exists and is accessible before listing child
 * milestones. Returns not found when the project is missing, soft-deleted, or
 * belongs to another organization.
 */
export class ListProjectMilestonesUseCase {
  constructor(
    private readonly milestones: MilestoneRepository,
    private readonly projects: ProjectRepository,
  ) {}

  async execute(
    context: ListProjectMilestonesContext,
    input: ListProjectMilestonesInput,
  ): Promise<ListProjectMilestonesOutput> {
    requirePermission(context.role, PERMISSIONS.MILESTONES_READ);

    const project = await this.projects.findById(
      context.organizationId,
      input.projectId,
    );

    if (project === null || project.deletedAt !== undefined) {
      throw new ApplicationError({
        code: 'NOT_FOUND',
        message: 'The requested project was not found.',
        details: { projectId: input.projectId },
      });
    }

    const milestones = await this.milestones.listForProject(
      context.organizationId,
      input.projectId,
    );

    return {
      milestones: [...milestones].sort(compareMilestones),
    };
  }
}

function compareMilestones(left: Milestone, right: Milestone): number {
  return left.name.localeCompare(right.name, 'en', { sensitivity: 'base' });
}
