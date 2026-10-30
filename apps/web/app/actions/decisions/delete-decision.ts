'use server';

import { redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';
import { routes } from '@synaptria/config';
import type { DecisionId } from '@synaptria/core';

import { toDeleteDecisionContext } from '../../../lib/decision-context';
import { getRequestContext } from '../../../lib/request-context';
import { getDecisionService } from '../../../lib/decision-service';
import type { DeleteDecisionActionState } from './delete-decision-form';

export async function deleteDecisionAction(
  decisionId: DecisionId,
  _previousState: DeleteDecisionActionState,
): Promise<DeleteDecisionActionState> {
  try {
    const context = await getRequestContext();
    await getDecisionService().deleteDecision(toDeleteDecisionContext(context), { decisionId });
    revalidatePath(routes.decisions);
  } catch {
    return { status: 'error', message: 'The decision could not be deleted. Please try again.' };
  }

  redirect(routes.decisions);
}
