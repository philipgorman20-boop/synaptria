import type { OrganizationId, ProjectId } from '@synaptria/core';
import type { OrganizationRole } from '@synaptria/core/context';
import type { Project, ProjectRepository } from '@synaptria/domain/projects';
import { PERMISSIONS, requirePermission } from '@synaptria/permissions';

import { ApplicationError } from '../../shared/application-error';

export interface GetProjectContext {
  readonly organizationId: OrganizationId;
  readonly role: OrganizationRole;
}

export interface GetProjectInput {
  readonly projectId: ProjectId;
}

export interface GetProjectOutput {
  readonly project: Project;
}

/**
 * Fetches one project within the authenticated organization.
 *
 * Returns not found when the project is missing, soft-deleted, or belongs to
 * another organization.
 */
export class GetProjectUseCase {
  constructor(private readonly projects: ProjectRepository) {}

  async execute(
    context: GetProjectContext,
    input: GetProjectInput,
  ): Promise<GetProjectOutput> {
    requirePermission(context.role, PERMISSIONS.PROJECTS_READ);

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

    return { project };
  }
}
