'use server';

import type { BudgetId, BudgetLineId } from '@synaptria/core';
import { revalidatePath } from 'next/cache';
import { budgetRoute } from '@synaptria/config';

import { toDeleteBudgetLineContext } from '../../../lib/budget-context';
import { getRequestContext } from '../../../lib/request-context';
import { getBudgetLineService } from '../../../lib/budget-service';

import type { DeleteBudgetLineActionState } from './delete-budget-line-form';

export async function deleteBudgetLineAction(
  parentBudgetId: BudgetId,
  lineId: BudgetLineId,
  _previousState: DeleteBudgetLineActionState,
): Promise<DeleteBudgetLineActionState> {
  try {
    const context = await getRequestContext();
    await getBudgetLineService().deleteBudgetLine(toDeleteBudgetLineContext(context), { budgetLineId: lineId });
    revalidatePath(budgetRoute(parentBudgetId));
  } catch {
    return { status: 'error', message: 'The budget line could not be deleted. Please try again.' };
  }

  return { status: 'idle' };
}
