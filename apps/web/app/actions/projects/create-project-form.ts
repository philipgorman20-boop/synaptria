import { ApplicationError } from '@synaptria/application';
import type { CreateProjectInput } from '@synaptria/application';
import { programId } from '@synaptria/core';
import { CoreError } from '@synaptria/core/errors';
import { AuthorizationDeniedError } from '@synaptria/core/errors';

export interface CreateProjectActionState {
  readonly status: 'idle' | 'error';
  readonly message?: string;
  readonly fieldErrors?: Readonly<{
    name?: string;
    code?: string;
    description?: string;
    programId?: string;
  }>;
  readonly values?: Readonly<{
    name: string;
    code: string;
    description: string;
    programId: string;
  }>;
}

export interface CreateProjectFormValues {
  readonly name: string;
  readonly code: string;
  readonly description: string;
  readonly programId: string;
}

export const initialCreateProjectState: CreateProjectActionState = {
  status: 'idle',
};

const PROGRAM_ID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export function suggestProjectCodeFromName(name: string): string {
  return name
    .toUpperCase()
    .trim()
    .replace(/[^A-Z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .replace(/-{2,}/g, '-');
}

export function resolveSuggestedProjectCode(
  name: string,
  codeWasEdited: boolean,
  manualCode: string,
): string {
  return codeWasEdited ? manualCode : suggestProjectCodeFromName(name);
}

export function readCreateProjectFormValues(
  formData: FormData,
): CreateProjectFormValues {
  return {
    name: readText(formData, 'name'),
    code: readText(formData, 'code'),
    description: readText(formData, 'description'),
    programId: readText(formData, 'programId'),
  };
}

export function validateCreateProjectFormValues(
  values: CreateProjectFormValues,
): CreateProjectActionState | undefined {
  const fieldErrors: {
    name?: string;
    code?: string;
    description?: string;
    programId?: string;
  } = {};

  const name = values.name.trim();
  const code = values.code.trim();
  const programIdValue = values.programId.trim();

  if (name.length === 0) {
    fieldErrors.name = 'Project name is required.';
  }

  if (code.length > 0 && !/^[A-Za-z0-9]+(?:-[A-Za-z0-9]+)*$/.test(code)) {
    fieldErrors.code = 'Use letters, numbers, and single hyphens only.';
  }

  if (
    programIdValue.length > 0 &&
    !PROGRAM_ID_PATTERN.test(programIdValue)
  ) {
    fieldErrors.programId = 'Select a valid program.';
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

export function toCreateProjectInput(
  values: CreateProjectFormValues,
): CreateProjectInput {
  const name = values.name.trim();
  const code = values.code.trim();
  const description = values.description.trim();
  const programIdValue = values.programId.trim();

  return {
    name,
    ...(code.length === 0 ? {} : { code }),
    ...(description.length === 0 ? {} : { description }),
    ...(programIdValue.length === 0
      ? {}
      : { programId: programId(programIdValue) }),
  };
}

export function mapCreateProjectActionError(
  error: unknown,
  values: CreateProjectFormValues,
): CreateProjectActionState | undefined {
  if (error instanceof AuthorizationDeniedError) {
    return {
      status: 'error',
      message: 'You do not have permission to create projects.',
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
  values: CreateProjectFormValues,
): CreateProjectActionState {
  const field = error.details?.field;
  const applicationFieldErrors = mapApplicationFieldError(error, field);

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

function mapApplicationFieldError(
  error: ApplicationError,
  field: unknown,
): CreateProjectActionState['fieldErrors'] | undefined {
  if (field === 'name' || field === 'code' || field === 'description') {
    return { [field]: error.message };
  }

  if (field === 'programId' && error.code === 'NOT_FOUND') {
    return {
      programId: 'The selected program is not available.',
    };
  }

  if (error.code === 'CONFLICT' && field === 'name') {
    return { name: error.message };
  }

  if (error.code === 'CONFLICT' && field === 'code') {
    return { code: error.message };
  }

  if (error.code === 'CONFLICT') {
    return { name: error.message };
  }

  if (field === 'programId') {
    return { programId: error.message };
  }

  return undefined;
}

function mapConflictError(
  error: CoreError,
  values: CreateProjectFormValues,
): CreateProjectActionState {
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
