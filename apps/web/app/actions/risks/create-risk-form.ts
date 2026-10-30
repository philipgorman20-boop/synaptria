import { ApplicationError } from '@synaptria/application';
import { AuthorizationDeniedError } from '@synaptria/core/errors';
import type { RiskCategory } from '@synaptria/domain/risks';

export interface CreateRiskActionState {
  readonly status: 'idle' | 'error';
  readonly message?: string;
  readonly fieldErrors?: Readonly<{
    title?: string;
    category?: string;
    description?: string;
  }>;
  readonly values?: Readonly<{
    title: string;
    category: string;
    description: string;
    programId: string;
    projectId: string;
  }>;
}

export interface CreateRiskFormValues {
  readonly title: string;
  readonly category: string;
  readonly description: string;
  readonly programId: string;
  readonly projectId: string;
}

export const initialCreateRiskState: CreateRiskActionState = { status: 'idle' };

export function readCreateRiskFormValues(formData: FormData): CreateRiskFormValues {
  return {
    title: readText(formData, 'title'),
    category: readText(formData, 'category'),
    description: readText(formData, 'description'),
    programId: readText(formData, 'programId'),
    projectId: readText(formData, 'projectId'),
  };
}

export function validateCreateRiskFormValues(
  values: CreateRiskFormValues,
): CreateRiskActionState | undefined {
  const fieldErrors: { title?: string; category?: string } = {};

  if (values.title.trim().length === 0) {
    fieldErrors.title = 'Risk title is required.';
  }

  if (values.category.trim().length === 0) {
    fieldErrors.category = 'Category is required.';
  }

  if (Object.keys(fieldErrors).length === 0) return undefined;

  return {
    status: 'error',
    message: 'Correct the highlighted fields and try again.',
    fieldErrors,
    values,
  };
}

export function mapCreateRiskActionError(
  error: unknown,
  values: CreateRiskFormValues,
): CreateRiskActionState | undefined {
  if (error instanceof AuthorizationDeniedError) {
    return { status: 'error', message: 'You do not have permission to create risks.', values };
  }

  if (error instanceof ApplicationError) {
    return { status: 'error', message: error.message, values };
  }

  return undefined;
}

export function isRiskCategory(value: string): value is RiskCategory {
  return [
    'SCIENTIFIC', 'CLINICAL', 'REGULATORY', 'CMC', 'MANUFACTURING',
    'FINANCIAL', 'VENDOR', 'OPERATIONAL', 'LEGAL', 'IP', 'PEOPLE', 'OTHER',
  ].includes(value);
}

function readText(formData: FormData, field: string): string {
  const value = formData.get(field);
  return typeof value === 'string' ? value.trim() : '';
}
