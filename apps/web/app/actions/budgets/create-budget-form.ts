import { ApplicationError } from '@synaptria/application';
import { AuthorizationDeniedError } from '@synaptria/core/errors';
import { CoreError } from '@synaptria/core/errors';
import type { BudgetPeriodType } from '@synaptria/domain/budgets';

export interface CreateBudgetActionState {
  readonly status: 'idle' | 'error';
  readonly message?: string;
  readonly fieldErrors?: Readonly<{ name?: string; periodType?: string; startDate?: string; endDate?: string }>;
  readonly values?: Readonly<{ name: string; periodType: string; startDate: string; endDate: string; description: string }>;
}

export interface CreateBudgetFormValues {
  readonly name: string;
  readonly periodType: string;
  readonly startDate: string;
  readonly endDate: string;
  readonly description: string;
}

export const initialCreateBudgetState: CreateBudgetActionState = { status: 'idle' };

export function readCreateBudgetFormValues(formData: FormData): CreateBudgetFormValues {
  return {
    name: readText(formData, 'name'),
    periodType: readText(formData, 'periodType'),
    startDate: readText(formData, 'startDate'),
    endDate: readText(formData, 'endDate'),
    description: readText(formData, 'description'),
  };
}

export function validateCreateBudgetFormValues(
  values: CreateBudgetFormValues,
): CreateBudgetActionState | undefined {
  const fieldErrors: { name?: string; periodType?: string; startDate?: string; endDate?: string } = {};

  if (values.name.trim().length === 0) fieldErrors.name = 'Budget name is required.';
  if (values.periodType.trim().length === 0) fieldErrors.periodType = 'Period type is required.';
  if (values.startDate.trim().length === 0) fieldErrors.startDate = 'Start date is required.';
  if (values.endDate.trim().length === 0) fieldErrors.endDate = 'End date is required.';

  if (Object.keys(fieldErrors).length === 0) return undefined;

  return { status: 'error', message: 'Correct the highlighted fields and try again.', fieldErrors, values };
}

export function mapCreateBudgetActionError(
  error: unknown,
  values: CreateBudgetFormValues,
): CreateBudgetActionState | undefined {
  if (error instanceof AuthorizationDeniedError) {
    return { status: 'error', message: 'You do not have permission to create budgets.', values };
  }
  if (error instanceof ApplicationError) {
    const fieldErrors = error.details?.field === 'name' ? { name: error.message } : undefined;
    return {
      status: 'error',
      message: fieldErrors === undefined ? error.message : 'Correct the highlighted fields and try again.',
      ...(fieldErrors === undefined ? {} : { fieldErrors }),
      values,
    };
  }
  if (error instanceof CoreError && error.code === 'CONFLICT') {
    return {
      status: 'error',
      message: 'Correct the highlighted fields and try again.',
      fieldErrors: { name: error.message },
      values,
    };
  }
  return undefined;
}

export function isBudgetPeriodType(value: string): value is BudgetPeriodType {
  return ['MONTHLY', 'QUARTERLY', 'ANNUAL', 'CUSTOM'].includes(value);
}

function readText(formData: FormData, field: string): string {
  const value = formData.get(field);
  return typeof value === 'string' ? value.trim() : '';
}
