'use server';

import { redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';
import { routes } from '@synaptria/config';
import type { RiskId } from '@synaptria/core';

import { toDeleteRiskContext } from '../../../lib/risk-context';
import { getRequestContext } from '../../../lib/request-context';
import { getRiskService } from '../../../lib/risk-service';
import type { DeleteRiskActionState } from './delete-risk-form';

export async function deleteRiskAction(
  riskId: RiskId,
  _previousState: DeleteRiskActionState,
): Promise<DeleteRiskActionState> {
  try {
    const context = await getRequestContext();
    await getRiskService().deleteRisk(toDeleteRiskContext(context), { riskId });
    revalidatePath(routes.risks);
  } catch {
    return { status: 'error', message: 'The risk could not be deleted. Please try again.' };
  }

  redirect(routes.risks);
}
