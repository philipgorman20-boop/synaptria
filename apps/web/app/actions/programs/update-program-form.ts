import { ApplicationError } from '@synaptria/application';
import { AuthorizationDeniedError } from '@synaptria/core/errors';
import type { ProgramPriority, ProgramStatus } from '@synaptria/domain/programs';

export interface UpdateProgramActionState {
  readonly status: 'idle' | 'success' | 'error';
  readonly message?: string;
  readonly fieldErrors?: Readonly<{
    name?: string;
  }>;
  readonly values?: Readonly<{
    name: string;
    status: string;
    priority: string;
    description: string;
    indication: string;
    modality: string;
    target: string;
  }>;
}

export interface UpdateProgramFormValues {
  readonly name: string;
  readonly status: string;
  readonly priority: string;
  readonly description: string;
  readonly indication: string;
  readonly modality: string;
  readonly target: string;
}

export const initialUpdateProgramState: UpdateProgramActionState = { status: 'idle' };

export function readUpdateProgramFormValues(formData: FormData): UpdateProgramFormValues {
  return {
    name: readText(formData, 'name'),
    status: readText(formData, 'status'),
    priority: readText(formData, 'priority'),
    description: readText(formData, 'description'),
    indication: readText(formData, 'indication'),
    modality: readText(formData, 'modality'),
    target: readText(formData, 'target'),
  };
}

export function validateUpdateProgramFormValues(
  values: UpdateProgramFormValues,
): UpdateProgramActionState | undefined {
  const fieldErrors: { name?: string } = {};

  if (values.name.trim().length === 0) {
    fieldErrors.name = 'Program name is required.';
  }

  if (Object.keys(fieldErrors).length === 0) return undefined;

  return {
    status: 'error',
    message: 'Correct the highlighted fields and try again.',
    fieldErrors,
    values,
  };
}

export function mapUpdateProgramActionError(
  error: unknown,
  values: UpdateProgramFormValues,
): UpdateProgramActionState | undefined {
  if (error instanceof AuthorizationDeniedError) {
    return { status: 'error', message: 'You do not have permission to update programs.', values };
  }

  if (error instanceof ApplicationError) {
    return { status: 'error', message: error.message, values };
  }

  return undefined;
}

export function isProgramStatus(value: string): value is ProgramStatus {
  return [
    'CONCEPT', 'DISCOVERY', 'PRECLINICAL', 'IND_ENABLING',
    'CLINICAL', 'PARTNERED', 'ON_HOLD', 'COMPLETED', 'TERMINATED',
  ].includes(value);
}

export function isProgramPriority(value: string): value is ProgramPriority {
  return ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'].includes(value);
}

function readText(formData: FormData, field: string): string {
  const value = formData.get(field);
  return typeof value === 'string' ? value.trim() : '';
}
