import { ApplicationError } from '@synaptria/application';
import type { CreateMilestoneInput } from '@synaptria/application';
import { projectId } from '@synaptria/core';
import { AuthorizationDeniedError } from '@synaptria/core/errors';

export interface CreateMilestoneActionState {
  readonly status: 'idle' | 'error';
  readonly message?: string;
  readonly fieldErrors?: Readonly<{
    projectId?: string;
    name?: string;
    description?: string;
    status?: string;
    priority?: string;
    plannedStartDate?: string;
    plannedEndDate?: string;
    actualStartDate?: string;
    actualEndDate?: string;
  }>;
  readonly values?: Readonly<CreateMilestoneFormValues>;
}

export interface CreateMilestoneFormValues {
  readonly projectId: string;
  readonly name: string;
  readonly description: string;
  readonly status: string;
  readonly priority: string;
  readonly plannedStartDate: string;
  readonly plannedEndDate: string;
  readonly actualStartDate: string;
  readonly actualEndDate: string;
}

export const initialCreateMilestoneState: CreateMilestoneActionState = {
  status: 'idle',
};

const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

const MILESTONE_STATUSES = [
  'PLANNED',
  'IN_PROGRESS',
  'BLOCKED',
  'COMPLETED',
  'CANCELLED',
] as const;

const MILESTONE_PRIORITIES = ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'] as const;

export function readCreateMilestoneFormValues(
  formData: FormData,
): CreateMilestoneFormValues {
  return {
    projectId: readText(formData, 'projectId'),
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

export function validateCreateMilestoneFormValues(
  values: CreateMilestoneFormValues,
): CreateMilestoneActionState | undefined {
  const fieldErrors: {
    projectId?: string;
    name?: string;
    description?: string;
    status?: string;
    priority?: string;
    plannedStartDate?: string;
    plannedEndDate?: string;
    actualStartDate?: string;
    actualEndDate?: string;
  } = {};

  const projectIdValue = values.projectId.trim();
  const name = values.name.trim();

  if (projectIdValue.length === 0) {
    fieldErrors.projectId = 'Project is required.';
  } else if (!UUID_PATTERN.test(projectIdValue)) {
    fieldErrors.projectId = 'Select a valid project.';
  }

  if (name.length === 0) {
    fieldErrors.name = 'Milestone name is required.';
  }

  validateOptionalEnum(values.status, MILESTONE_STATUSES, 'status', fieldErrors);
  validateOptionalEnum(
    values.priority,
    MILESTONE_PRIORITIES,
    'priority',
    fieldErrors,
  );
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

export function toCreateMilestoneInput(
  values: CreateMilestoneFormValues,
): CreateMilestoneInput {
  const name = values.name.trim();
  const description = values.description.trim();
  const status = values.status.trim();
  const priority = values.priority.trim();
  const plannedStartDate = readOptionalDate(values.plannedStartDate);
  const plannedEndDate = readOptionalDate(values.plannedEndDate);
  const actualStartDate = readOptionalDate(values.actualStartDate);
  const actualEndDate = readOptionalDate(values.actualEndDate);

  return {
    projectId: projectId(values.projectId.trim()),
    name,
    ...(description.length === 0 ? {} : { description }),
    ...(status.length === 0 || !isMilestoneStatus(status) ? {} : { status }),
    ...(priority.length === 0 || !isMilestonePriority(priority) ? {} : { priority }),
    ...(plannedStartDate === undefined ? {} : { plannedStartDate }),
    ...(plannedEndDate === undefined ? {} : { plannedEndDate }),
    ...(actualStartDate === undefined ? {} : { actualStartDate }),
    ...(actualEndDate === undefined ? {} : { actualEndDate }),
  };
}

export function mapCreateMilestoneActionError(
  error: unknown,
  values: CreateMilestoneFormValues,
): CreateMilestoneActionState | undefined {
  if (error instanceof AuthorizationDeniedError) {
    return {
      status: 'error',
      message: 'You do not have permission to create milestones.',
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
  values: CreateMilestoneFormValues,
): CreateMilestoneActionState {
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
): CreateMilestoneActionState['fieldErrors'] | undefined {
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

  if (field === 'projectId' && error.code === 'NOT_FOUND') {
    return {
      projectId: 'The selected project is not available.',
    };
  }

  if (field === 'projectId') {
    return { projectId: error.message };
  }

  return undefined;
}

function validateOptionalEnum<T extends string>(
  value: string,
  allowed: readonly T[],
  field:
    | 'status'
    | 'priority',
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

function isMilestoneStatus(
  value: string,
): value is (typeof MILESTONE_STATUSES)[number] {
  return (MILESTONE_STATUSES as readonly string[]).includes(value);
}

function isMilestonePriority(
  value: string,
): value is (typeof MILESTONE_PRIORITIES)[number] {
  return (MILESTONE_PRIORITIES as readonly string[]).includes(value);
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
