'use server';

import type { BudgetCategoryId } from '@synaptria/core';
import { AuthorizationDeniedError } from '@synaptria/core/errors';
import { revalidatePath } from 'next/cache';
import { routes } from '@synaptria/config';

import { toDeleteBudgetCategoryContext } from '../../../lib/budget-context';
import { getRequestContext } from '../../../lib/request-context';
import { getBudgetLineService } from '../../../lib/budget-service';

import type { DeleteBudgetCategoryActionState } from './delete-budget-category-form';

export async function deleteBudgetCategoryAction(
  categoryId: BudgetCategoryId,
  _previousState: DeleteBudgetCategoryActionState,
): Promise<DeleteBudgetCategoryActionState> {
  try {
    const context = await getRequestContext();
    await getBudgetLineService().deleteBudgetCategory(toDeleteBudgetCategoryContext(context), {
      budgetCategoryId: categoryId,
    });

    revalidatePath(routes.budgets);
  } catch (error) {
    if (error instanceof AuthorizationDeniedError) {
      return { status: 'error', message: 'You do not have permission to delete budget categories.' };
    }
    return { status: 'error', message: 'The category could not be deleted. Please try again.' };
  }

  return { status: 'success' };
}
