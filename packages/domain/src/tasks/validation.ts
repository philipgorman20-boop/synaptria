import { CoreError } from '@synaptria/core';
import type { MilestoneId, OrganizationId } from '@synaptria/core';

import { isPriority, type Priority } from '../shared/priority';
import type { TaskStatus } from './models';
import type { CreateTaskInput, UpdateTaskInput } from './task-repository';

export const TASK_STATUSES = [
  'TODO',
  'IN_PROGRESS',
  'BLOCKED',
  'COMPLETED',
  'CANCELLED',
] as const satisfies readonly TaskStatus[];

export const DEFAULT_TASK_STATUS: TaskStatus = 'TODO';
export const DEFAULT_TASK_PRIORITY: Priority = 'MEDIUM';

export interface NormalizedCreateTaskInput {
  readonly organizationId: OrganizationId;
  readonly milestoneId: MilestoneId;
  readonly name: string;
  readonly description?: string;
  readonly status?: TaskStatus;
  readonly priority?: Priority;
  readonly plannedStartDate?: Date;
  readonly plannedEndDate?: Date;
  readonly actualStartDate?: Date;
  readonly actualEndDate?: Date;
}

export interface NormalizedUpdateTaskInput {
  readonly name?: string;
  readonly description?: string | null;
  readonly status?: TaskStatus;
  readonly priority?: Priority;
  readonly plannedStartDate?: Date | null;
  readonly plannedEndDate?: Date | null;
  readonly actualStartDate?: Date | null;
  readonly actualEndDate?: Date | null;
}

export function normalizeCreateTaskInput(
  input: CreateTaskInput,
): NormalizedCreateTaskInput {
  requireOrganizationId(input.organizationId);
  requireMilestoneId(input.milestoneId);

  const name = requireText(input.name, 'name');

  if (input.status !== undefined && !isTaskStatus(input.status)) {
    throw validationError('status must be a supported task status.', 'status');
  }

  if (input.priority !== undefined && !isPriority(input.priority)) {
    throw validationError('priority must be a supported priority.', 'priority');
  }

  validateDateRange(
    input.plannedStartDate,
    input.plannedEndDate,
    'plannedStartDate',
    'plannedEndDate',
  );
  validateDateRange(
    input.actualStartDate,
    input.actualEndDate,
    'actualStartDate',
    'actualEndDate',
  );

  return {
    organizationId: input.organizationId,
    milestoneId: input.milestoneId,
    name,
    ...(input.description === undefined
      ? {}
      : { description: optionalText(input.description, 'description') }),
    ...(input.status === undefined ? {} : { status: input.status }),
    ...(input.priority === undefined ? {} : { priority: input.priority }),
    ...(input.plannedStartDate === undefined
      ? {}
      : { plannedStartDate: input.plannedStartDate }),
    ...(input.plannedEndDate === undefined
      ? {}
      : { plannedEndDate: input.plannedEndDate }),
    ...(input.actualStartDate === undefined
      ? {}
      : { actualStartDate: input.actualStartDate }),
    ...(input.actualEndDate === undefined ? {} : { actualEndDate: input.actualEndDate }),
  };
}

export function normalizeUpdateTaskInput(
  input: UpdateTaskInput,
): NormalizedUpdateTaskInput {
  const name =
    input.name === undefined ? undefined : requireText(input.name, 'name');
  const description =
    input.description === undefined || input.description === null
      ? input.description
      : optionalText(input.description, 'description');

  if (input.status !== undefined && !isTaskStatus(input.status)) {
    throw validationError('status must be a supported task status.', 'status');
  }

  if (input.priority !== undefined && !isPriority(input.priority)) {
    throw validationError('priority must be a supported priority.', 'priority');
  }

  validateOptionalDateRange(
    input.plannedStartDate,
    input.plannedEndDate,
    'plannedStartDate',
    'plannedEndDate',
  );
  validateOptionalDateRange(
    input.actualStartDate,
    input.actualEndDate,
    'actualStartDate',
    'actualEndDate',
  );

  return {
    ...(name === undefined ? {} : { name }),
    ...(description === undefined ? {} : { description }),
    ...(input.status === undefined ? {} : { status: input.status }),
    ...(input.priority === undefined ? {} : { priority: input.priority }),
    ...(input.plannedStartDate === undefined
      ? {}
      : { plannedStartDate: input.plannedStartDate }),
    ...(input.plannedEndDate === undefined
      ? {}
      : { plannedEndDate: input.plannedEndDate }),
    ...(input.actualStartDate === undefined
      ? {}
      : { actualStartDate: input.actualStartDate }),
    ...(input.actualEndDate === undefined ? {} : { actualEndDate: input.actualEndDate }),
  };
}

export function applyCreateTaskDefaults(
  input: NormalizedCreateTaskInput,
): NormalizedCreateTaskInput & {
  readonly status: TaskStatus;
  readonly priority: Priority;
} {
  return {
    ...input,
    status: input.status ?? DEFAULT_TASK_STATUS,
    priority: input.priority ?? DEFAULT_TASK_PRIORITY,
  };
}

function requireOrganizationId(value: OrganizationId): void {
  if (String(value).trim().length === 0) {
    throw validationError('organizationId cannot be empty.', 'organizationId');
  }
}

function requireMilestoneId(value: MilestoneId): void {
  if (String(value).trim().length === 0) {
    throw validationError('milestoneId cannot be empty.', 'milestoneId');
  }
}

function requireText(value: string, field: string): string {
  const normalized = value.trim();
  if (normalized.length === 0) {
    throw validationError(`${field} cannot be empty.`, field);
  }
  return normalized;
}

function optionalText(value: string, field: string): string {
  const normalized = value.trim();
  if (normalized.length === 0) {
    throw validationError(`${field} cannot be empty.`, field);
  }
  return normalized;
}

function isTaskStatus(value: string): value is TaskStatus {
  return (TASK_STATUSES as readonly string[]).includes(value);
}

function requireValidDate(value: Date, field: string): void {
  if (Number.isNaN(value.getTime())) {
    throw validationError(`${field} must be a valid date.`, field);
  }
}

function validateDateRange(
  startDate: Date | undefined,
  endDate: Date | undefined,
  startField: string,
  endField: string,
): void {
  if (startDate !== undefined) {
    requireValidDate(startDate, startField);
  }

  if (endDate !== undefined) {
    requireValidDate(endDate, endField);
  }

  if (
    startDate !== undefined &&
    endDate !== undefined &&
    startDate.getTime() > endDate.getTime()
  ) {
    throw validationError(
      `${startField} must be on or before ${endField}.`,
      startField,
    );
  }
}

// Partial update patches cannot compare against existing task dates here.
// Step 2 update use cases must load the task, apply the patch, validate the
// resulting complete planned and actual date ranges, then call the repository.
function validateOptionalDateRange(
  startDate: Date | null | undefined,
  endDate: Date | null | undefined,
  startField: string,
  endField: string,
): void {
  if (startDate !== undefined && startDate !== null) {
    requireValidDate(startDate, startField);
  }

  if (endDate !== undefined && endDate !== null) {
    requireValidDate(endDate, endField);
  }

  if (
    startDate !== undefined &&
    endDate !== undefined &&
    startDate !== null &&
    endDate !== null &&
    startDate.getTime() > endDate.getTime()
  ) {
    throw validationError(
      `${startField} must be on or before ${endField}.`,
      startField,
    );
  }
}

function validationError(message: string, field: string): CoreError {
  return new CoreError({
    code: 'VALIDATION_FAILED',
    message,
    details: { field },
  });
}
