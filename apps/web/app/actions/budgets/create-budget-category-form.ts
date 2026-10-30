import { ApplicationError } from '@synaptria/application';
import { AuthorizationDeniedError } from '@synaptria/core/errors';

export interface CreateBudgetCategoryActionState {
  readonly status: 'idle' | 'error';
  readonly message?: string;
  readonly fieldErrors?: Readonly<{ name?: string }>;
  readonly values?: Readonly<{ name: string; outflowType: string; description: string; code: string }>;
}

export interface CreateBudgetCategoryFormValues {
  readonly name: string;
  readonly outflowType: string;
  readonly description: string;
  readonly code: string;
}

export const initialCreateBudgetCategoryState: CreateBudgetCategoryActionState = { status: 'idle' };

export function readCreateBudgetCategoryFormValues(formData: FormData): CreateBudgetCategoryFormValues {
  return {
    name: readText(formData, 'name'),
    outflowType: readText(formData, 'outflowType'),
    description: readText(formData, 'description'),
    code: readText(formData, 'code'),
  };
}

export function validateCreateBudgetCategoryFormValues(
  values: CreateBudgetCategoryFormValues,
): CreateBudgetCategoryActionState | undefined {
  const fieldErrors: { name?: string } = {};
  if (values.name.trim().length === 0) fieldErrors.name = 'Name is required.';
  if (Object.keys(fieldErrors).length === 0) return undefined;
  return { status: 'error', message: 'Correct the highlighted fields and try again.', fieldErrors, values };
}

export function mapCreateBudgetCategoryActionError(
  error: unknown,
  values: CreateBudgetCategoryFormValues,
): CreateBudgetCategoryActionState | undefined {
  if (error instanceof AuthorizationDeniedError) {
    return { status: 'error', message: 'You do not have permission to create budget categories.', values };
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
