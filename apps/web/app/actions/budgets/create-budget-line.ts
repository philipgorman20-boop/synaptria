'use server';

import { budgetCategoryId, budgetId, programId, projectId } from '@synaptria/core';
import type { BudgetId } from '@synaptria/core';
import { revalidatePath } from 'next/cache';
import { budgetRoute } from '@synaptria/config';

import { toCreateBudgetLineContext } from '../../../lib/budget-context';
import { getRequestContext } from '../../../lib/request-context';
import { getBudgetLineService } from '../../../lib/budget-service';

import {
  mapCreateBudgetLineActionError,
  readCreateBudgetLineFormValues,
  validateCreateBudgetLineFormValues,
  type CreateBudgetLineActionState,
} from './create-budget-line-form';

export async function createBudgetLineAction(
  parentBudgetId: BudgetId,
  _previousState: CreateBudgetLineActionState,
  formData: FormData,
): Promise<CreateBudgetLineActionState> {
  const values = readCreateBudgetLineFormValues(formData);
  const validation = validateCreateBudgetLineFormValues(values);

  if (validation !== undefined) return validation;

  const periodStart = new Date(values.periodStart);
  const periodEnd = new Date(values.periodEnd);

  if (isNaN(periodStart.getTime())) {
    return {
      status: 'error',
      message: 'Correct the highlighted fields and try again.',
      fieldErrors: { periodStart: 'Please enter a valid start date.' },
      values,
    };
  }

  if (isNaN(periodEnd.getTime())) {
    return {
      status: 'error',
      message: 'Correct the highlighted fields and try again.',
      fieldErrors: { periodEnd: 'Please enter a valid end date.' },
      values,
    };
  }

  const plannedAmount = values.plannedAmount.length > 0 ? parseFloat(values.plannedAmount) : undefined;
  if (plannedAmount !== undefined && isNaN(plannedAmount)) {
    return { status: 'error', message: 'Correct the highlighted fields and try again.', values };
  }

  const actualAmount = values.actualAmount.length > 0 ? parseFloat(values.actualAmount) : undefined;
  if (actualAmount !== undefined && isNaN(actualAmount)) {
    return { status: 'error', message: 'Correct the highlighted fields and try again.', values };
  }

  try {
    const context = await getRequestContext();
    await getBudgetLineService().createBudgetLine(toCreateBudgetLineContext(context), {
      budgetId: parentBudgetId,
      categoryId: budgetCategoryId(values.categoryId),
      name: values.name,
      periodStart,
      periodEnd,
      ...(values.programId.length > 0 ? { programId: programId(values.programId) } : {}),
      ...(values.projectId.length > 0 ? { projectId: projectId(values.projectId) } : {}),
      ...(values.notes.length > 0 ? { notes: values.notes } : {}),
      ...(plannedAmount !== undefined ? { plannedAmount } : {}),
      ...(actualAmount !== undefined ? { actualAmount } : {}),
      ...(values.currency.length > 0 ? { currency: values.currency } : {}),
    });

    revalidatePath(budgetRoute(parentBudgetId));
  } catch (error) {
    const mapped = mapCreateBudgetLineActionError(error, values);
    if (mapped !== undefined) return mapped;

    return {
      status: 'error',
      message: 'The budget line could not be created. Please try again.',
      values,
    };
  }

  return { status: 'idle' };
}
