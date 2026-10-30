'use server';

import { revalidatePath } from 'next/cache';
import { riskRoute, routes } from '@synaptria/config';

import { toUpdateRiskContext } from '../../../lib/risk-context';
import { getRequestContext } from '../../../lib/request-context';
import { getRiskService } from '../../../lib/risk-service';

import {
  isRiskCategory,
  isRiskImpact,
  isRiskProbability,
  isRiskStatus,
  mapUpdateRiskActionError,
  readUpdateRiskFormValues,
  validateUpdateRiskFormValues,
  type UpdateRiskActionState,
} from './update-risk-form';

import { programId, projectId, type RiskId } from '@synaptria/core';

export async function updateRiskAction(
  riskId: RiskId,
  _previousState: UpdateRiskActionState,
  formData: FormData,
): Promise<UpdateRiskActionState> {
  const values = readUpdateRiskFormValues(formData);
  const validation = validateUpdateRiskFormValues(values);

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
    await getRiskService().updateRisk(toUpdateRiskContext(context), {
      riskId,
      title: values.title,
      category: values.category,
      ...(isRiskStatus(values.status) ? { status: values.status } : {}),
      ...(isRiskProbability(values.probability) ? { probability: values.probability } : {}),
      ...(isRiskImpact(values.impact) ? { impact: values.impact } : {}),
      ...(values.description.length > 0 ? { description: values.description } : { description: null }),
      ...(values.mitigationPlan.length > 0 ? { mitigationPlan: values.mitigationPlan } : { mitigationPlan: null }),
      ...(values.contingencyPlan.length > 0 ? { contingencyPlan: values.contingencyPlan } : { contingencyPlan: null }),
      programId: values.programId.length > 0 ? programId(values.programId) : null,
      projectId: values.projectId.length > 0 ? projectId(values.projectId) : null,
    });

    revalidatePath(routes.risks);
    revalidatePath(riskRoute(riskId));
  } catch (error) {
    const mapped = mapUpdateRiskActionError(error, values);
    if (mapped !== undefined) return mapped;

    return {
      status: 'error',
      message: 'The risk could not be updated. Please try again.',
      values,
    };
  }

  return { status: 'success' };
}
