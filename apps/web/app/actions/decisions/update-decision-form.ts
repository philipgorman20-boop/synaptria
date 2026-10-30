import { ApplicationError } from '@synaptria/application';
import { AuthorizationDeniedError } from '@synaptria/core/errors';
import type { DecisionStatus } from '@synaptria/domain/decisions';

export interface UpdateDecisionActionState {
  readonly status: 'idle' | 'success' | 'error';
  readonly message?: string;
  readonly fieldErrors?: Readonly<{ title?: string; status?: string }>;
  readonly values?: Readonly<{
    title: string;
    status: string;
    context: string;
    decision: string;
    rationale: string;
    alternatives: string;
    decisionDate: string;
    effectiveDate: string;
    programId: string;
    projectId: string;
  }>;
}

export interface UpdateDecisionFormValues {
  readonly title: string;
  readonly status: string;
  readonly context: string;
  readonly decision: string;
  readonly rationale: string;
  readonly alternatives: string;
  readonly decisionDate: string;
  readonly effectiveDate: string;
  readonly programId: string;
  readonly projectId: string;
}

export const initialUpdateDecisionState: UpdateDecisionActionState = { status: 'idle' };

export function readUpdateDecisionFormValues(formData: FormData): UpdateDecisionFormValues {
  return {
    title: readText(formData, 'title'),
    status: readText(formData, 'status'),
    context: readText(formData, 'context'),
    decision: readText(formData, 'decision'),
    rationale: readText(formData, 'rationale'),
    alternatives: readText(formData, 'alternatives'),
    decisionDate: readText(formData, 'decisionDate'),
    effectiveDate: readText(formData, 'effectiveDate'),
    programId: readText(formData, 'programId'),
    projectId: readText(formData, 'projectId'),
  };
}

export function validateUpdateDecisionFormValues(
  values: UpdateDecisionFormValues,
): UpdateDecisionActionState | undefined {
  if (values.title.trim().length === 0) {
    return {
      status: 'error',
      message: 'Correct the highlighted fields and try again.',
      fieldErrors: { title: 'Title is required.' },
      values,
    };
  }
  return undefined;
}

export function mapUpdateDecisionActionError(
  error: unknown,
  values: UpdateDecisionFormValues,
): UpdateDecisionActionState | undefined {
  if (error instanceof AuthorizationDeniedError) {
    return { status: 'error', message: 'You do not have permission to update decisions.', values };
  }

  if (error instanceof ApplicationError) {
    return { status: 'error', message: error.message, values };
  }

  return undefined;
}

export function isDecisionStatus(value: string): value is DecisionStatus {
  return ['PROPOSED', 'APPROVED', 'REJECTED', 'SUPERSEDED'].includes(value);
}

function readText(formData: FormData, field: string): string {
  const value = formData.get(field);
  return typeof value === 'string' ? value.trim() : '';
}
