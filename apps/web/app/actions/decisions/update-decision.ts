'use server';

import { decisionRoute, routes } from '@synaptria/config';
import { programId, projectId, type DecisionId } from '@synaptria/core';
import { revalidatePath } from 'next/cache';

import { toUpdateDecisionContext } from '../../../lib/decision-context';
import { getRequestContext } from '../../../lib/request-context';
import { getDecisionService } from '../../../lib/decision-service';

import {
  isDecisionStatus,
  mapUpdateDecisionActionError,
  readUpdateDecisionFormValues,
  validateUpdateDecisionFormValues,
  type UpdateDecisionActionState,
} from './update-decision-form';

export async function updateDecisionAction(
  decisionId: DecisionId,
  _previousState: UpdateDecisionActionState,
  formData: FormData,
): Promise<UpdateDecisionActionState> {
  const values = readUpdateDecisionFormValues(formData);
  const validation = validateUpdateDecisionFormValues(values);

  if (validation !== undefined) return validation;

  try {
    const context = await getRequestContext();
    await getDecisionService().updateDecision(toUpdateDecisionContext(context), {
      decisionId,
      title: values.title,
      ...(isDecisionStatus(values.status) ? { status: values.status } : {}),
      ...(values.context.length > 0 ? { context: values.context } : { context: null }),
      ...(values.decision.length > 0 ? { decision: values.decision } : { decision: null }),
      ...(values.rationale.length > 0 ? { rationale: values.rationale } : { rationale: null }),
      ...(values.alternatives.length > 0 ? { alternatives: values.alternatives } : { alternatives: null }),
      ...(values.decisionDate.length > 0 ? { decisionDate: new Date(values.decisionDate) } : { decisionDate: null }),
      ...(values.effectiveDate.length > 0 ? { effectiveDate: new Date(values.effectiveDate) } : { effectiveDate: null }),
      programId: values.programId.length > 0 ? programId(values.programId) : null,
      projectId: values.projectId.length > 0 ? projectId(values.projectId) : null,
    });

    revalidatePath(routes.decisions);
    revalidatePath(decisionRoute(decisionId));
  } catch (error) {
    const mapped = mapUpdateDecisionActionError(error, values);
    if (mapped !== undefined) return mapped;

    return {
      status: 'error',
      message: 'The decision could not be updated. Please try again.',
      values,
    };
  }

  return { status: 'success' };
}
