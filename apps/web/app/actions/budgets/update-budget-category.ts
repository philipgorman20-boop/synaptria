'use server';

import type { BudgetCategoryId } from '@synaptria/core';
import type { BudgetCategoryOutflowType } from '@synaptria/domain/budgets';
import { revalidatePath } from 'next/cache';
import { routes } from '@synaptria/config';

import { toUpdateBudgetCategoryContext } from '../../../lib/budget-context';
import { getRequestContext } from '../../../lib/request-context';
import { getBudgetLineService } from '../../../lib/budget-service';

import {
  mapUpdateBudgetCategoryActionError,
  readUpdateBudgetCategoryFormValues,
  validateUpdateBudgetCategoryFormValues,
  type UpdateBudgetCategoryActionState,
} from './update-budget-category-form';

export async function updateBudgetCategoryAction(
  categoryId: BudgetCategoryId,
  _previousState: UpdateBudgetCategoryActionState,
  formData: FormData,
): Promise<UpdateBudgetCategoryActionState> {
  const values = readUpdateBudgetCategoryFormValues(formData);
  const validation = validateUpdateBudgetCategoryFormValues(values);
  if (validation !== undefined) return validation;

  try {
    const context = await getRequestContext();
    await getBudgetLineService().updateBudgetCategory(toUpdateBudgetCategoryContext(context), {
      budgetCategoryId: categoryId,
      ...(values.name.length > 0 ? { name: values.name } : {}),
      ...(values.outflowType.length > 0 ? { outflowType: values.outflowType as BudgetCategoryOutflowType } : {}),
      description: values.description.length > 0 ? values.description : null,
      code: values.code.length > 0 ? values.code : null,
    });

    revalidatePath(routes.budgets);
  } catch (error) {
    const mapped = mapUpdateBudgetCategoryActionError(error, values);
    if (mapped !== undefined) return mapped;
    return { status: 'error', message: 'The category could not be updated. Please try again.', values };
  }

  return { status: 'success' };
}
