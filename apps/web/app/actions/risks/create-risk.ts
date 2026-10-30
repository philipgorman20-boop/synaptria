'use server';

import { routes } from '@synaptria/config';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';

import { programId, projectId } from '@synaptria/core';
import { toCreateRiskContext } from '../../../lib/risk-context';
import { getRequestContext } from '../../../lib/request-context';
import { getRiskService } from '../../../lib/risk-service';

import {
  isRiskCategory,
  mapCreateRiskActionError,
  readCreateRiskFormValues,
  validateCreateRiskFormValues,
  type CreateRiskActionState,
} from './create-risk-form';

export async function createRiskAction(
  _previousState: CreateRiskActionState,
  formData: FormData,
): Promise<CreateRiskActionState> {
  const values = readCreateRiskFormValues(formData);
  const validation = validateCreateRiskFormValues(values);

  if (validation !== undefined) {
    return validation;
  }

  if (!isRiskCategory(values.category)) {
    return {
      status: 'error',
      message: 'Invalid risk category.',
      fieldErrors: { category: 'Please select a valid category.' },
      values,
    };
  }

  try {
    const context = await getRequestContext();
    await getRiskService().createRisk(toCreateRiskContext(context), {
      title: values.title,
      category: values.category,
      ...(values.description.length === 0 ? {} : { description: values.description }),
      ...(values.programId.length > 0 ? { programId: programId(values.programId) } : {}),
      ...(values.projectId.length > 0 ? { projectId: projectId(values.projectId) } : {}),
    });

    revalidatePath(routes.risks);
    revalidatePath(routes.dashboard);
  } catch (error) {
    const mapped = mapCreateRiskActionError(error, values);
    if (mapped !== undefined) return mapped;

    return {
      status: 'error',
      message: 'The risk could not be created. Please try again.',
      values,
    };
  }

  redirect(routes.risks);
}
