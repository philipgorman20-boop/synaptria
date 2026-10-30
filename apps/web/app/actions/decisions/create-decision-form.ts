import { ApplicationError } from '@synaptria/application';
import { AuthorizationDeniedError } from '@synaptria/core/errors';

export interface CreateDecisionActionState {
  readonly status: 'idle' | 'error';
  readonly message?: string;
  readonly fieldErrors?: Readonly<{ title?: string }>;
  readonly values?: Readonly<{ title: string; context: string; decision: string; rationale: string; programId: string; projectId: string }>;
}

export interface CreateDecisionFormValues {
  readonly title: string;
  readonly context: string;
  readonly decision: string;
  readonly rationale: string;
  readonly programId: string;
  readonly projectId: string;
}

export const initialCreateDecisionState: CreateDecisionActionState = { status: 'idle' };

export function readCreateDecisionFormValues(formData: FormData): CreateDecisionFormValues {
  return {
    title: readText(formData, 'title'),
    context: readText(formData, 'context'),
    decision: readText(formData, 'decision'),
    rationale: readText(formData, 'rationale'),
    programId: readText(formData, 'programId'),
    projectId: readText(formData, 'projectId'),
  };
}

export function validateCreateDecisionFormValues(
  values: CreateDecisionFormValues,
): CreateDecisionActionState | undefined {
  if (values.title.trim().length === 0) {
    return {
      status: 'error',
      message: 'Correct the highlighted fields and try again.',
      fieldErrors: { title: 'Decision title is required.' },
      values,
    };
  }
  return undefined;
}

export function mapCreateDecisionActionError(
  error: unknown,
  values: CreateDecisionFormValues,
): CreateDecisionActionState | undefined {
  if (error instanceof AuthorizationDeniedError) {
    return { status: 'error', message: 'You do not have permission to create decisions.', values };
  }
  if (error instanceof ApplicationError) {
    return { status: 'error', message: error.message, values };
  }
  return undefined;
}

function readText(formData: FormData, field: string): string {
  const value = formData.get(field);
  return typeof value === 'string' ? value.trim() : '';
}
