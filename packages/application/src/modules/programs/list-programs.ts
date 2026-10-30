import type { OrganizationId } from '@synaptria/core';
import type { OrganizationRole } from '@synaptria/core/context';
import type { Program, ProgramRepository } from '@synaptria/domain/programs';
import { PERMISSIONS, requirePermission } from '@synaptria/permissions';

export interface ListProgramsContext {
  readonly organizationId: OrganizationId;
  readonly role: OrganizationRole;
}

export interface ListProgramsOutput {
  readonly programs: readonly Program[];
}

/**
 * Lists programs for the authenticated organization.
 *
 * The persistence adapter scopes this query by organizationId. The
 * application layer repeats soft-delete filtering so a different repository
 * implementation cannot accidentally expose deleted records.
 */
export class ListProgramsUseCase {
  constructor(private readonly programs: ProgramRepository) {}

  async execute(context: ListProgramsContext): Promise<ListProgramsOutput> {
    requirePermission(context.role, PERMISSIONS.PROGRAMS_READ);

    const programs = await this.programs.listForOrganization(
      context.organizationId,
    );

    return {
      programs: programs
        .filter(isAccessibleProgram)
        .sort(comparePrograms),
    };
  }
}

function isAccessibleProgram(program: Program): boolean {
  return program.deletedAt === undefined;
}

function comparePrograms(left: Program, right: Program): number {
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
