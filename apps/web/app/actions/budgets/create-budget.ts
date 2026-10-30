'use server';

import { routes } from '@synaptria/config';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';

import { toCreateBudgetContext } from '../../../lib/budget-context';
import { getRequestContext } from '../../../lib/request-context';
import { getBudgetService } from '../../../lib/budget-service';

import {
  isBudgetPeriodType,
  mapCreateBudgetActionError,
  readCreateBudgetFormValues,
  validateCreateBudgetFormValues,
  type CreateBudgetActionState,
} from './create-budget-form';

export async function createBudgetAction(
  _previousState: CreateBudgetActionState,
  formData: FormData,
): Promise<CreateBudgetActionState> {
  const values = readCreateBudgetFormValues(formData);
  const validation = validateCreateBudgetFormValues(values);

  if (validation !== undefined) return validation;

  if (!isBudgetPeriodType(values.periodType)) {
    return {
      status: 'error',
      message: 'Invalid period type.',
      fieldErrors: { periodType: 'Please select a valid period type.' },
      values,
    };
  }

  const startDate = new Date(values.startDate);
  const endDate = new Date(values.endDate);

  if (isNaN(startDate.getTime())) {
    return {
      status: 'error',
      message: 'Correct the highlighted fields and try again.',
      fieldErrors: { startDate: 'Please enter a valid start date.' },
      values,
    };
  }

  if (isNaN(endDate.getTime())) {
    return {
      status: 'error',
      message: 'Correct the highlighted fields and try again.',
      fieldErrors: { endDate: 'Please enter a valid end date.' },
      values,
    };
  }

  try {
    const context = await getRequestContext();
    await getBudgetService().createBudget(toCreateBudgetContext(context), {
      name: values.name,
      periodType: values.periodType,
      startDate,
      endDate,
      ...(values.description.length === 0 ? {} : { description: values.description }),
    });

    revalidatePath(routes.budgets);
    revalidatePath(routes.dashboard);
  } catch (error) {
    const mapped = mapCreateBudgetActionError(error, values);
    if (mapped !== undefined) return mapped;

    return {
      status: 'error',
      message: 'The budget could not be created. Please try again.',
      values,
    };
  }

  redirect(routes.budgets);
}
