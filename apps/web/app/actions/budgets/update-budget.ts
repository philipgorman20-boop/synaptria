'use server';

import { budgetRoute, routes } from '@synaptria/config';
import { type BudgetId } from '@synaptria/core';
import { revalidatePath } from 'next/cache';

import { toUpdateBudgetContext } from '../../../lib/budget-context';
import { getRequestContext } from '../../../lib/request-context';
import { getBudgetService } from '../../../lib/budget-service';

import {
  isBudgetPeriodType,
  isBudgetStatus,
  mapUpdateBudgetActionError,
  readUpdateBudgetFormValues,
  validateUpdateBudgetFormValues,
  type UpdateBudgetActionState,
} from './update-budget-form';

export async function updateBudgetAction(
  budgetId: BudgetId,
  _previousState: UpdateBudgetActionState,
  formData: FormData,
): Promise<UpdateBudgetActionState> {
  const values = readUpdateBudgetFormValues(formData);
  const validation = validateUpdateBudgetFormValues(values);

  if (validation !== undefined) return validation;

  try {
    const context = await getRequestContext();
    await getBudgetService().updateBudget(toUpdateBudgetContext(context), {
      budgetId,
      name: values.name,
      ...(isBudgetStatus(values.status) ? { status: values.status } : {}),
      ...(isBudgetPeriodType(values.periodType) ? { periodType: values.periodType } : {}),
      ...(values.currency.length > 0 ? { currency: values.currency } : {}),
      ...(values.startDate.length > 0 ? { startDate: new Date(values.startDate) } : {}),
      ...(values.endDate.length > 0 ? { endDate: new Date(values.endDate) } : {}),
      ...(values.description.length > 0 ? { description: values.description } : {}),
    });

    revalidatePath(routes.budgets);
    revalidatePath(budgetRoute(budgetId));
  } catch (error) {
    const mapped = mapUpdateBudgetActionError(error, values);
    if (mapped !== undefined) return mapped;

    return {
      status: 'error',
      message: 'The budget could not be updated. Please try again.',
      values,
    };
  }

  return { status: 'success' };
}
