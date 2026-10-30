import { ApplicationError } from '@synaptria/application';
import { AuthorizationDeniedError } from '@synaptria/core/errors';
import type { BudgetPeriodType, BudgetStatus } from '@synaptria/domain/budgets';

export interface UpdateBudgetActionState {
  readonly status: 'idle' | 'success' | 'error';
  readonly message?: string;
  readonly fieldErrors?: Readonly<{
    name?: string;
    startDate?: string;
    endDate?: string;
  }>;
  readonly values?: Readonly<{
    name: string;
    status: string;
    periodType: string;
    currency: string;
    startDate: string;
    endDate: string;
    description: string;
  }>;
}

export interface UpdateBudgetFormValues {
  readonly name: string;
  readonly status: string;
  readonly periodType: string;
  readonly currency: string;
  readonly startDate: string;
  readonly endDate: string;
  readonly description: string;
}

export const initialUpdateBudgetState: UpdateBudgetActionState = { status: 'idle' };

export function readUpdateBudgetFormValues(formData: FormData): UpdateBudgetFormValues {
  return {
    name: readText(formData, 'name'),
    status: readText(formData, 'status'),
    periodType: readText(formData, 'periodType'),
    currency: readText(formData, 'currency'),
    startDate: readText(formData, 'startDate'),
    endDate: readText(formData, 'endDate'),
    description: readText(formData, 'description'),
  };
}

export function validateUpdateBudgetFormValues(
  values: UpdateBudgetFormValues,
): UpdateBudgetActionState | undefined {
  const fieldErrors: { name?: string; startDate?: string; endDate?: string } = {};

  if (values.name.trim().length === 0) fieldErrors.name = 'Budget name is required.';
  if (values.startDate.length === 0) fieldErrors.startDate = 'Start date is required.';
  if (values.endDate.length === 0) fieldErrors.endDate = 'End date is required.';

  if (Object.keys(fieldErrors).length === 0) return undefined;

  return {
    status: 'error',
    message: 'Correct the highlighted fields and try again.',
    fieldErrors,
    values,
  };
}

export function mapUpdateBudgetActionError(
  error: unknown,
  values: UpdateBudgetFormValues,
): UpdateBudgetActionState | undefined {
  if (error instanceof AuthorizationDeniedError) {
    return { status: 'error', message: 'You do not have permission to update budgets.', values };
  }

  if (error instanceof ApplicationError) {
    return { status: 'error', message: error.message, values };
  }

  return undefined;
}

export function isBudgetStatus(value: string): value is BudgetStatus {
  return ['DRAFT', 'APPROVED', 'ACTIVE', 'CLOSED', 'ARCHIVED'].includes(value);
}

export function isBudgetPeriodType(value: string): value is BudgetPeriodType {
  return ['MONTHLY', 'QUARTERLY', 'ANNUAL', 'CUSTOM'].includes(value);
}

function readText(formData: FormData, field: string): string {
  const value = formData.get(field);
  return typeof value === 'string' ? value.trim() : '';
}
