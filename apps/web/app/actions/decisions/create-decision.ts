'use server';

import { routes } from '@synaptria/config';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';

import { programId, projectId } from '@synaptria/core';
import { toCreateDecisionContext } from '../../../lib/decision-context';
import { getRequestContext } from '../../../lib/request-context';
import { getDecisionService } from '../../../lib/decision-service';

import {
  mapCreateDecisionActionError,
  readCreateDecisionFormValues,
  validateCreateDecisionFormValues,
  type CreateDecisionActionState,
} from './create-decision-form';

export async function createDecisionAction(
  _previousState: CreateDecisionActionState,
  formData: FormData,
): Promise<CreateDecisionActionState> {
  const values = readCreateDecisionFormValues(formData);
  const validation = validateCreateDecisionFormValues(values);

  if (validation !== undefined) return validation;

  try {
    const context = await getRequestContext();
    await getDecisionService().createDecision(toCreateDecisionContext(context), {
      title: values.title,
      ...(values.context.length === 0 ? {} : { context: values.context }),
      ...(values.decision.length === 0 ? {} : { decision: values.decision }),
      ...(values.rationale.length === 0 ? {} : { rationale: values.rationale }),
      ...(values.programId.length > 0 ? { programId: programId(values.programId) } : {}),
      ...(values.projectId.length > 0 ? { projectId: projectId(values.projectId) } : {}),
    });

    revalidatePath(routes.decisions);
    revalidatePath(routes.dashboard);
  } catch (error) {
    const mapped = mapCreateDecisionActionError(error, values);
    if (mapped !== undefined) return mapped;

    return {
      status: 'error',
      message: 'The decision could not be created. Please try again.',
      values,
    };
  }

  redirect(routes.decisions);
}
