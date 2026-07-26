import type { OrganizationId, ProgramId } from '@synaptria/core';
import type { OrganizationRole } from '@synaptria/core/context';
import type { ProgramRepository } from '@synaptria/domain/programs';
import type { Project, ProjectRepository } from '@synaptria/domain/projects';
import { PERMISSIONS, requirePermission } from '@synaptria/permissions';

import { ApplicationError } from '../../shared/application-error';

export interface ListProgramProjectsContext {
  readonly organizationId: OrganizationId;
  readonly role: OrganizationRole;
}

export interface ListProgramProjectsInput {
  readonly programId: ProgramId;
}

export interface ListProgramProjectsOutput {
  readonly projects: readonly Project[];
}

/**
 * Lists projects for one program within the authenticated organization.
 *
 * Verifies the parent program exists and is accessible before listing child
 * projects. Returns not found when the program is missing, soft-deleted, or
 * belongs to another organization.
 */
export class ListProgramProjectsUseCase {
  constructor(
    private readonly projects: ProjectRepository,
    private readonly programs: ProgramRepository,
  ) {}

  async execute(
    context: ListProgramProjectsContext,
    input: ListProgramProjectsInput,
  ): Promise<ListProgramProjectsOutput> {
    requirePermission(context.role, PERMISSIONS.PROJECTS_READ);

    const program = await this.programs.findById(
      context.organizationId,
      input.programId,
    );

    if (program === null || program.deletedAt !== undefined) {
      throw new ApplicationError({
        code: 'NOT_FOUND',
        message: 'The requested program was not found.',
        details: { programId: input.programId },
      });
    }

    const projects = await this.projects.listForProgram(
      context.organizationId,
      input.programId,
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
