import { ApplicationError } from '@synaptria/application';
import { AuthorizationDeniedError } from '@synaptria/core/errors';
import type { ProjectPriority, ProjectStatus } from '@synaptria/domain/projects';

export interface UpdateProjectActionState {
  readonly status: 'idle' | 'success' | 'error';
  readonly message?: string;
  readonly fieldErrors?: Readonly<{
    name?: string;
    percentComplete?: string;
  }>;
  readonly values?: Readonly<{
    name: string;
    status: string;
    priority: string;
    percentComplete: string;
    description: string;
    programId: string;
  }>;
}

export interface UpdateProjectFormValues {
  readonly name: string;
  readonly status: string;
  readonly priority: string;
  readonly percentComplete: string;
  readonly description: string;
  readonly programId: string;
}

export const initialUpdateProjectState: UpdateProjectActionState = { status: 'idle' };

export function readUpdateProjectFormValues(formData: FormData): UpdateProjectFormValues {
  return {
    name: readText(formData, 'name'),
    status: readText(formData, 'status'),
    priority: readText(formData, 'priority'),
    percentComplete: readText(formData, 'percentComplete'),
    description: readText(formData, 'description'),
    programId: readText(formData, 'programId'),
  };
}

export function validateUpdateProjectFormValues(
  values: UpdateProjectFormValues,
): UpdateProjectActionState | undefined {
  const fieldErrors: { name?: string; percentComplete?: string } = {};

  if (values.name.trim().length === 0) {
    fieldErrors.name = 'Project name is required.';
  }

  const pct = Number(values.percentComplete);
  if (values.percentComplete !== '' && (isNaN(pct) || pct < 0 || pct > 100)) {
    fieldErrors.percentComplete = 'Percent complete must be between 0 and 100.';
  }

  if (Object.keys(fieldErrors).length === 0) return undefined;

  return {
    status: 'error',
    message: 'Correct the highlighted fields and try again.',
    fieldErrors,
    values,
  };
}

export function mapUpdateProjectActionError(
  error: unknown,
  values: UpdateProjectFormValues,
): UpdateProjectActionState | undefined {
  if (error instanceof AuthorizationDeniedError) {
    return { status: 'error', message: 'You do not have permission to update projects.', values };
  }

  if (error instanceof ApplicationError) {
    return { status: 'error', message: error.message, values };
  }

  return undefined;
}

export function isProjectStatus(value: string): value is ProjectStatus {
  return ['PLANNED', 'ACTIVE', 'ON_HOLD', 'COMPLETED', 'CANCELLED'].includes(value);
}

export function isProjectPriority(value: string): value is ProjectPriority {
  return ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'].includes(value);
}

function readText(formData: FormData, field: string): string {
  const value = formData.get(field);
  return typeof value === 'string' ? value.trim() : '';
}
