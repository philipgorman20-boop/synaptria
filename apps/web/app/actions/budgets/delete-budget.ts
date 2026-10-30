'use server';

import { redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';
import { routes } from '@synaptria/config';
import type { BudgetId } from '@synaptria/core';

import { toDeleteBudgetContext } from '../../../lib/budget-context';
import { getRequestContext } from '../../../lib/request-context';
import { getBudgetService } from '../../../lib/budget-service';

import type { DeleteBudgetActionState } from './delete-budget-form';

export async function deleteBudgetAction(
  budgetId: BudgetId,
  _previousState: DeleteBudgetActionState,
): Promise<DeleteBudgetActionState> {
  try {
    const context = await getRequestContext();
    await getBudgetService().deleteBudget(toDeleteBudgetContext(context), { budgetId });
    revalidatePath(routes.budgets);
  } catch {
    return { status: 'error', message: 'The budget could not be deleted. Please try again.' };
  }

  redirect(routes.budgets);
}
