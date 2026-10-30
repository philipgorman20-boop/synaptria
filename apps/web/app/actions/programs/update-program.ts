'use server';

import { revalidatePath } from 'next/cache';
import { programRoute, routes } from '@synaptria/config';
import type { ProgramId } from '@synaptria/core';

import { toUpdateProgramContext } from '../../../lib/program-context';
import { getRequestContext } from '../../../lib/request-context';
import { getProgramService } from '../../../lib/program-service';

import {
  isProgramPriority,
  isProgramStatus,
  mapUpdateProgramActionError,
  readUpdateProgramFormValues,
  validateUpdateProgramFormValues,
  type UpdateProgramActionState,
} from './update-program-form';

export async function updateProgramAction(
  programId: ProgramId,
  _previousState: UpdateProgramActionState,
  formData: FormData,
): Promise<UpdateProgramActionState> {
  const values = readUpdateProgramFormValues(formData);
  const validation = validateUpdateProgramFormValues(values);

  if (validation !== undefined) return validation;

  try {
    const context = await getRequestContext();
    await getProgramService().updateProgram(toUpdateProgramContext(context), {
      programId,
      name: values.name,
      ...(isProgramStatus(values.status) ? { status: values.status } : {}),
      ...(isProgramPriority(values.priority) ? { priority: values.priority } : {}),
      ...(values.description.length > 0 ? { description: values.description } : { description: null }),
      ...(values.indication.length > 0 ? { indication: values.indication } : { indication: null }),
      ...(values.modality.length > 0 ? { modality: values.modality } : { modality: null }),
      ...(values.target.length > 0 ? { target: values.target } : { target: null }),
    });

    revalidatePath(routes.programs);
    revalidatePath(programRoute(programId));
  } catch (error) {
    const mapped = mapUpdateProgramActionError(error, values);
    if (mapped !== undefined) return mapped;

    return { status: 'error', message: 'The program could not be updated. Please try again.', values };
  }

  return { status: 'success' };
}
