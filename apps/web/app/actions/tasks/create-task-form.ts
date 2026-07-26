import { ApplicationError } from '@synaptria/application';
import type { CreateTaskInput } from '@synaptria/application';
import { milestoneId } from '@synaptria/core';
import { AuthorizationDeniedError } from '@synaptria/core/errors';

export interface CreateTaskActionState {
  readonly status: 'idle' | 'error';
  readonly message?: string;
  readonly fieldErrors?: Readonly<{
    milestoneId?: string;
    name?: string;
    description?: string;
    status?: string;
    priority?: string;
    plannedStartDate?: string;
    plannedEndDate?: string;
    actualStartDate?: string;
    actualEndDate?: string;
  }>;
  readonly values?: Readonly<CreateTaskFormValues>;
}

export interface CreateTaskFormValues {
  readonly milestoneId: string;
  readonly name: string;
  readonly description: string;
  readonly status: string;
  readonly priority: string;
  readonly plannedStartDate: string;
  readonly plannedEndDate: string;
  readonly actualStartDate: string;
  readonly actualEndDate: string;
}

export const initialCreateTaskState: CreateTaskActionState = {
  status: 'idle',
};

const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

const TASK_STATUSES = [
  'TODO',
  'IN_PROGRESS',
  'BLOCKED',
  'COMPLETED',
  'CANCELLED',
] as const;

const TASK_PRIORITIES = ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'] as const;

export function readCreateTaskFormValues(formData: FormData): CreateTaskFormValues {
  return {
    milestoneId: readText(formData, 'milestoneId'),
    name: readText(formData, 'name'),
    description: readText(formData, 'description'),
    status: readText(formData, 'status'),
    priority: readText(formData, 'priority'),
    plannedStartDate: readText(formData, 'plannedStartDate'),
    plannedEndDate: readText(formData, 'plannedEndDate'),
    actualStartDate: readText(formData, 'actualStartDate'),
    actualEndDate: readText(formData, 'actualEndDate'),
  };
}

export function validateCreateTaskFormValues(
  values: CreateTaskFormValues,
): CreateTaskActionState | undefined {
  const fieldErrors: {
    milestoneId?: string;
    name?: string;
    description?: string;
    status?: string;
    priority?: string;
    plannedStartDate?: string;
    plannedEndDate?: string;
    actualStartDate?: string;
    actualEndDate?: string;
  } = {};

  const milestoneIdValue = values.milestoneId.trim();
  const name = values.name.trim();

  if (milestoneIdValue.length === 0) {
    fieldErrors.milestoneId = 'Milestone is required.';
  } else if (!UUID_PATTERN.test(milestoneIdValue)) {
    fieldErrors.milestoneId = 'Select a valid milestone.';
  }

  if (name.length === 0) {
    fieldErrors.name = 'Task name is required.';
  }

  validateOptionalEnum(values.status, TASK_STATUSES, 'status', fieldErrors);
  validateOptionalEnum(values.priority, TASK_PRIORITIES, 'priority', fieldErrors);
  validateOptionalDate(values.plannedStartDate, 'plannedStartDate', fieldErrors);
  validateOptionalDate(values.plannedEndDate, 'plannedEndDate', fieldErrors);
  validateOptionalDate(values.actualStartDate, 'actualStartDate', fieldErrors);
  validateOptionalDate(values.actualEndDate, 'actualEndDate', fieldErrors);

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

export function toCreateTaskInput(values: CreateTaskFormValues): CreateTaskInput {
  const name = values.name.trim();
  const description = values.description.trim();
  const status = values.status.trim();
  const priority = values.priority.trim();
  const plannedStartDate = readOptionalDate(values.plannedStartDate);
  const plannedEndDate = readOptionalDate(values.plannedEndDate);
  const actualStartDate = readOptionalDate(values.actualStartDate);
  const actualEndDate = readOptionalDate(values.actualEndDate);

  return {
    milestoneId: milestoneId(values.milestoneId.trim()),
    name,
    ...(description.length === 0 ? {} : { description }),
    ...(status.length === 0 || !isTaskStatus(status) ? {} : { status }),
    ...(priority.length === 0 || !isTaskPriority(priority) ? {} : { priority }),
    ...(plannedStartDate === undefined ? {} : { plannedStartDate }),
    ...(plannedEndDate === undefined ? {} : { plannedEndDate }),
    ...(actualStartDate === undefined ? {} : { actualStartDate }),
    ...(actualEndDate === undefined ? {} : { actualEndDate }),
  };
}

export function mapCreateTaskActionError(
  error: unknown,
  values: CreateTaskFormValues,
): CreateTaskActionState | undefined {
  if (error instanceof AuthorizationDeniedError) {
    return {
      status: 'error',
      message: 'You do not have permission to create tasks.',
      values,
    };
  }

  if (error instanceof ApplicationError) {
    return mapApplicationError(error, values);
  }

  return undefined;
}

function mapApplicationError(
  error: ApplicationError,
  values: CreateTaskFormValues,
): CreateTaskActionState {
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
): CreateTaskActionState['fieldErrors'] | undefined {
  if (
    field === 'name' ||
    field === 'description' ||
    field === 'status' ||
    field === 'priority' ||
    field === 'plannedStartDate' ||
    field === 'plannedEndDate' ||
    field === 'actualStartDate' ||
    field === 'actualEndDate'
  ) {
    return { [field]: error.message };
  }

  if (field === 'milestoneId' && error.code === 'NOT_FOUND') {
    return {
      milestoneId: 'The selected milestone is not available.',
    };
  }

  if (field === 'milestoneId') {
    return { milestoneId: error.message };
  }

  return undefined;
}

function validateOptionalEnum<T extends string>(
  value: string,
  allowed: readonly T[],
  field: 'status' | 'priority',
  fieldErrors: {
    status?: string;
    priority?: string;
  },
): void {
  const normalized = value.trim();
  if (normalized.length === 0) {
    return;
  }

  if (!(allowed as readonly string[]).includes(normalized)) {
    fieldErrors[field] = `Select a valid ${field}.`;
  }
}

function validateOptionalDate(
  value: string,
  field:
    | 'plannedStartDate'
    | 'plannedEndDate'
    | 'actualStartDate'
    | 'actualEndDate',
  fieldErrors: {
    plannedStartDate?: string;
    plannedEndDate?: string;
    actualStartDate?: string;
    actualEndDate?: string;
  },
): void {
  const normalized = value.trim();
  if (normalized.length === 0) {
    return;
  }

  if (Number.isNaN(Date.parse(normalized))) {
    fieldErrors[field] = 'Enter a valid date.';
  }
}

function isTaskStatus(value: string): value is (typeof TASK_STATUSES)[number] {
  return (TASK_STATUSES as readonly string[]).includes(value);
}

function isTaskPriority(value: string): value is (typeof TASK_PRIORITIES)[number] {
  return (TASK_PRIORITIES as readonly string[]).includes(value);
}

function readOptionalDate(value: string): Date | undefined {
  const normalized = value.trim();
  if (normalized.length === 0) {
    return undefined;
  }

  return new Date(normalized);
}

function readText(formData: FormData, field: string): string {
  const value = formData.get(field);
  return typeof value === 'string' ? value.trim() : '';
}
