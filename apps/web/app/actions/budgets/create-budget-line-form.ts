import { ApplicationError } from '@synaptria/application';
import { AuthorizationDeniedError } from '@synaptria/core/errors';

export interface CreateBudgetLineActionState {
  readonly status: 'idle' | 'error';
  readonly message?: string;
  readonly fieldErrors?: Readonly<{ name?: string; categoryId?: string; periodStart?: string; periodEnd?: string }>;
  readonly values?: Readonly<{
    name: string;
    categoryId: string;
    programId: string;
    projectId: string;
    notes: string;
    plannedAmount: string;
    actualAmount: string;
    currency: string;
    periodStart: string;
    periodEnd: string;
  }>;
}

export interface CreateBudgetLineFormValues {
  readonly name: string;
  readonly categoryId: string;
  readonly programId: string;
  readonly projectId: string;
  readonly notes: string;
  readonly plannedAmount: string;
  readonly actualAmount: string;
  readonly currency: string;
  readonly periodStart: string;
  readonly periodEnd: string;
}

export const initialCreateBudgetLineState: CreateBudgetLineActionState = { status: 'idle' };

export function readCreateBudgetLineFormValues(formData: FormData): CreateBudgetLineFormValues {
  return {
    name: readText(formData, 'name'),
    categoryId: readText(formData, 'categoryId'),
    programId: readText(formData, 'programId'),
    projectId: readText(formData, 'projectId'),
    notes: readText(formData, 'notes'),
    plannedAmount: readText(formData, 'plannedAmount'),
    actualAmount: readText(formData, 'actualAmount'),
    currency: readText(formData, 'currency'),
    periodStart: readText(formData, 'periodStart'),
    periodEnd: readText(formData, 'periodEnd'),
  };
}

export function validateCreateBudgetLineFormValues(
  values: CreateBudgetLineFormValues,
): CreateBudgetLineActionState | undefined {
  const fieldErrors: { name?: string; categoryId?: string; periodStart?: string; periodEnd?: string } = {};

  if (values.name.trim().length === 0) fieldErrors.name = 'Name is required.';
  if (values.categoryId.trim().length === 0) fieldErrors.categoryId = 'Category is required.';
  if (values.periodStart.trim().length === 0) fieldErrors.periodStart = 'Period start date is required.';
  if (values.periodEnd.trim().length === 0) fieldErrors.periodEnd = 'Period end date is required.';

  if (Object.keys(fieldErrors).length === 0) return undefined;

  return { status: 'error', message: 'Correct the highlighted fields and try again.', fieldErrors, values };
}

export function mapCreateBudgetLineActionError(
  error: unknown,
  values: CreateBudgetLineFormValues,
): CreateBudgetLineActionState | undefined {
  if (error instanceof AuthorizationDeniedError) {
    return { status: 'error', message: 'You do not have permission to create budget lines.', values };
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
  return undefined;
}

function readText(formData: FormData, field: string): string {
  const value = formData.get(field);
  return typeof value === 'string' ? value.trim() : '';
}
