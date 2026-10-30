'use server';

import { redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';
import { routes } from '@synaptria/config';
import type { ProgramId } from '@synaptria/core';

import { toDeleteProgramContext } from '../../../lib/program-context';
import { getRequestContext } from '../../../lib/request-context';
import { getProgramService } from '../../../lib/program-service';
import type { DeleteProgramActionState } from './delete-program-form';

export async function deleteProgramAction(
  programId: ProgramId,
  _previousState: DeleteProgramActionState,
): Promise<DeleteProgramActionState> {
  try {
    const context = await getRequestContext();
    await getProgramService().deleteProgram(toDeleteProgramContext(context), { programId });
    revalidatePath(routes.programs);
  } catch {
    return { status: 'error', message: 'The program could not be deleted. Please try again.' };
  }

  redirect(routes.programs);
}
