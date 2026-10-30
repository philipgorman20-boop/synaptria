import type { OrganizationId, ProgramId } from '@synaptria/core';
import type { OrganizationRole } from '@synaptria/core/context';
import type { Program, ProgramRepository } from '@synaptria/domain/programs';
import { PERMISSIONS, requirePermission } from '@synaptria/permissions';

import { ApplicationError } from '../../shared/application-error';

export interface GetProgramContext {
  readonly organizationId: OrganizationId;
  readonly role: OrganizationRole;
}

export interface GetProgramInput {
  readonly programId: ProgramId;
}

export interface GetProgramOutput {
  readonly program: Program;
}

/**
 * Fetches one program within the authenticated organization.
 *
 * Returns not found when the program is missing, soft-deleted, or belongs to
 * another organization.
 */
export class GetProgramUseCase {
  constructor(private readonly programs: ProgramRepository) {}

  async execute(
    context: GetProgramContext,
    input: GetProgramInput,
  ): Promise<GetProgramOutput> {
    requirePermission(context.role, PERMISSIONS.PROGRAMS_READ);

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

    return { program };
  }
}
