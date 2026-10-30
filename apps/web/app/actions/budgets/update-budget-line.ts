'use server';

import { budgetCategoryId, programId, projectId } from '@synaptria/core';
import type { BudgetId, BudgetLineId } from '@synaptria/core';
import { revalidatePath } from 'next/cache';
import { budgetRoute } from '@synaptria/config';

import { toUpdateBudgetLineContext } from '../../../lib/budget-context';
import { getRequestContext } from '../../../lib/request-context';
import { getBudgetLineService } from '../../../lib/budget-service';

import {
  mapUpdateBudgetLineActionError,
  readUpdateBudgetLineFormValues,
  validateUpdateBudgetLineFormValues,
  type UpdateBudgetLineActionState,
} from './update-budget-line-form';

export async function updateBudgetLineAction(
  parentBudgetId: BudgetId,
  lineId: BudgetLineId,
  _previousState: UpdateBudgetLineActionState,
  formData: FormData,
): Promise<UpdateBudgetLineActionState> {
  const values = readUpdateBudgetLineFormValues(formData);
  const validation = validateUpdateBudgetLineFormValues(values);

  if (validation !== undefined) return validation;

  const periodStart = values.periodStart.length > 0 ? new Date(values.periodStart) : undefined;
  const periodEnd = values.periodEnd.length > 0 ? new Date(values.periodEnd) : undefined;

  if (periodStart !== undefined && isNaN(periodStart.getTime())) {
    return {
      status: 'error',
      message: 'Correct the highlighted fields and try again.',
      fieldErrors: { periodStart: 'Please enter a valid start date.' },
      values,
    };
  }

  if (periodEnd !== undefined && isNaN(periodEnd.getTime())) {
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
    await getBudgetLineService().updateBudgetLine(toUpdateBudgetLineContext(context), {
      budgetLineId: lineId,
      name: values.name,
      ...(values.categoryId.length > 0 ? { categoryId: budgetCategoryId(values.categoryId) } : {}),
      programId: values.programId.length > 0 ? programId(values.programId) : null,
      projectId: values.projectId.length > 0 ? projectId(values.projectId) : null,
      notes: values.notes.length > 0 ? values.notes : null,
      ...(plannedAmount !== undefined ? { plannedAmount } : {}),
      ...(actualAmount !== undefined ? { actualAmount } : {}),
      ...(values.currency.length > 0 ? { currency: values.currency } : {}),
      ...(periodStart !== undefined ? { periodStart } : {}),
      ...(periodEnd !== undefined ? { periodEnd } : {}),
    });

    revalidatePath(budgetRoute(parentBudgetId));
  } catch (error) {
    const mapped = mapUpdateBudgetLineActionError(error, values);
    if (mapped !== undefined) return mapped;

    return {
      status: 'error',
      message: 'The budget line could not be updated. Please try again.',
      values,
    };
  }

  return { status: 'success' };
}
