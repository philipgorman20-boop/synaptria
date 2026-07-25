'use server';

import { routes } from '@synaptria/config';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';

import { toCreateProgramContext } from '../../../lib/program-context';
import { getRequestContext } from '../../../lib/request-context';
import { getProgramService } from '../../../lib/program-service';

import {
  mapCreateProgramActionError,
  readCreateProgramFormValues,
  validateCreateProgramFormValues,
  type CreateProgramActionState,
} from './create-program-form';

export {
  initialCreateProgramState,
  type CreateProgramActionState,
} from './create-program-form';

export async function createProgramAction(
  _previousState: CreateProgramActionState,
  formData: FormData,
): Promise<CreateProgramActionState> {
  const values = readCreateProgramFormValues(formData);
  const validation = validateCreateProgramFormValues(values);

  if (validation !== undefined) {
    return validation;
  }

  try {
    const context = await getRequestContext();
    await getProgramService().createProgram(
      toCreateProgramContext(context),
      {
        name: values.name,
        ...(values.code.length === 0 ? {} : { code: values.code }),
        ...(values.description.length === 0
          ? {}
          : { description: values.description }),
      },
    );

    revalidatePath(routes.programs);
    revalidatePath(routes.dashboard);
  } catch (error) {
    const mapped = mapCreateProgramActionError(error, values);
    if (mapped !== undefined) {
      return mapped;
    }

    return {
      status: 'error',
      message: 'The program could not be created. Please try again.',
      values,
    };
  }

  redirect(routes.programs);
}
