import type { OrganizationId } from '@synaptria/core';
import type { OrganizationRole } from '@synaptria/core/context';
import type { Project, ProjectRepository } from '@synaptria/domain/projects';
import { PERMISSIONS, requirePermission } from '@synaptria/permissions';

export interface ListProjectsContext {
  readonly organizationId: OrganizationId;
  readonly role: OrganizationRole;
}

export interface ListProjectsOutput {
  readonly projects: readonly Project[];
}

/**
 * Lists all projects for the authenticated organization.
 *
 * The persistence adapter scopes this query by organizationId. The
 * application layer repeats soft-delete filtering so a different repository
 * implementation cannot accidentally expose deleted records.
 */
export class ListProjectsUseCase {
  constructor(private readonly projects: ProjectRepository) {}

  async execute(context: ListProjectsContext): Promise<ListProjectsOutput> {
    requirePermission(context.role, PERMISSIONS.PROJECTS_READ);

    const projects = await this.projects.listForOrganization(
      context.organizationId,
    );

    return {
      projects: projects.filter(isAccessibleProject).sort(compareProjects),
    };
  }
}

function isAccessibleProject(project: Project): boolean {
  return project.deletedAt === undefined;
}

function compareProjects(left: Project, right: Project): number {
  const nameComparison = left.name.localeCompare(right.name, 'en', {
    sensitivity: 'base',
  });

  if (nameComparison !== 0) {
    return nameComparison;
  }

  const leftCode = left.code ?? '';
  const rightCode = right.code ?? '';
  return leftCode.localeCompare(rightCode, 'en', { sensitivity: 'base' });
}
