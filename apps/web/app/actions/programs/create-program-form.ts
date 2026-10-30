import { ApplicationError } from '@synaptria/application';
import { CoreError } from '@synaptria/core/errors';
import { AuthorizationDeniedError } from '@synaptria/core/errors';

export interface CreateProgramActionState {
  readonly status: 'idle' | 'error';
  readonly message?: string;
  readonly fieldErrors?: Readonly<{
    name?: string;
    code?: string;
    description?: string;
  }>;
  readonly values?: Readonly<{
    name: string;
    code: string;
    description: string;
  }>;
}

export interface CreateProgramFormValues {
  readonly name: string;
  readonly code: string;
  readonly description: string;
}

export const initialCreateProgramState: CreateProgramActionState = {
  status: 'idle',
};

export function suggestProgramCodeFromName(name: string): string {
  return name
    .toUpperCase()
    .trim()
    .replace(/[^A-Z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .replace(/-{2,}/g, '-');
}

export function readCreateProgramFormValues(
  formData: FormData,
): CreateProgramFormValues {
  return {
    name: readText(formData, 'name'),
    code: readText(formData, 'code'),
    description: readText(formData, 'description'),
  };
}

export function validateCreateProgramFormValues(
  values: CreateProgramFormValues,
): CreateProgramActionState | undefined {
  const fieldErrors: {
    name?: string;
    code?: string;
    description?: string;
  } = {};

  const name = values.name.trim();
  const code = values.code.trim();

  if (name.length === 0) {
    fieldErrors.name = 'Program name is required.';
  }

  if (code.length > 0 && !/^[A-Za-z0-9]+(?:-[A-Za-z0-9]+)*$/.test(code)) {
    fieldErrors.code = 'Use letters, numbers, and single hyphens only.';
  }

  if (Object.keys(fieldErrors).length === 0) {
    return undefined;
  }

  return {
    status: 'error',
    message: 'Correct the highlighted fields and try again.',
    fieldErrors,
    values,
  };
}

export function mapCreateProgramActionError(
  error: unknown,
  values: CreateProgramFormValues,
): CreateProgramActionState | undefined {
  if (error instanceof AuthorizationDeniedError) {
    return {
      status: 'error',
      message: 'You do not have permission to create programs.',
      values,
    };
  }

  if (error instanceof ApplicationError) {
    return mapApplicationError(error, values);
  }

  if (error instanceof CoreError && error.code === 'CONFLICT') {
    return mapConflictError(error, values);
  }

  return undefined;
}

function mapApplicationError(
  error: ApplicationError,
  values: CreateProgramFormValues,
): CreateProgramActionState {
  const field = error.details?.field;
  const applicationFieldErrors =
    field === 'name' || field === 'code' || field === 'description'
      ? { [field]: error.message }
      : error.code === 'CONFLICT' && field === 'name'
        ? { name: error.message }
        : error.code === 'CONFLICT' && field === 'code'
          ? { code: error.message }
          : error.code === 'CONFLICT'
            ? { name: error.message }
            : undefined;

  return {
    status: 'error',
    message:
      applicationFieldErrors === undefined
        ? error.message
        : 'Correct the highlighted fields and try again.',
    ...(applicationFieldErrors === undefined
      ? {}
      : { fieldErrors: applicationFieldErrors }),
    values,
  };
}

function mapConflictError(
  error: CoreError,
  values: CreateProgramFormValues,
): CreateProgramActionState {
  const field = error.details?.field;
  const fieldErrors =
    field === 'name' || field === 'code'
      ? { [field]: error.message }
      : { name: error.message };

  return {
    status: 'error',
    message: 'Correct the highlighted fields and try again.',
    fieldErrors,
    values,
  };
}

function readText(formData: FormData, field: string): string {
  const value = formData.get(field);
  return typeof value === 'string' ? value.trim() : '';
}
