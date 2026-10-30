'use server';

import type { BudgetCategoryOutflowType } from '@synaptria/domain/budgets';
import { revalidatePath } from 'next/cache';
import { routes } from '@synaptria/config';

import { toCreateBudgetCategoryContext } from '../../../lib/budget-context';
import { getRequestContext } from '../../../lib/request-context';
import { getBudgetLineService } from '../../../lib/budget-service';

import {
  mapCreateBudgetCategoryActionError,
  readCreateBudgetCategoryFormValues,
  validateCreateBudgetCategoryFormValues,
  type CreateBudgetCategoryActionState,
} from './create-budget-category-form';

export async function createBudgetCategoryAction(
  _previousState: CreateBudgetCategoryActionState,
  formData: FormData,
): Promise<CreateBudgetCategoryActionState> {
  const values = readCreateBudgetCategoryFormValues(formData);
  const validation = validateCreateBudgetCategoryFormValues(values);
  if (validation !== undefined) return validation;

  try {
    const context = await getRequestContext();
    await getBudgetLineService().createBudgetCategory(toCreateBudgetCategoryContext(context), {
      name: values.name,
      ...(values.outflowType.length > 0 ? { outflowType: values.outflowType as BudgetCategoryOutflowType } : {}),
      ...(values.description.length > 0 ? { description: values.description } : {}),
      ...(values.code.length > 0 ? { code: values.code } : {}),
    });

    revalidatePath(routes.budgets);
  } catch (error) {
    const mapped = mapCreateBudgetCategoryActionError(error, values);
    if (mapped !== undefined) return mapped;
    return { status: 'error', message: 'The category could not be created. Please try again.', values };
  }

  return { status: 'idle' };
}
