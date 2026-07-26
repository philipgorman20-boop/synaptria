import {
  appConfig,
  milestoneRoute,
  milestoneTasksRoute,
  newTaskRoute,
  projectRoute,
  taskRoute,
} from '@synaptria/config';
import {
  milestoneId,
  projectId,
  taskId,
  type MilestoneId,
  type ProjectId,
  type TaskId,
} from '@synaptria/core';
import type { Priority } from '@synaptria/domain/shared';
import type { TaskStatus } from '@synaptria/domain/tasks';

const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

const TASK_STATUS_LABELS: Record<TaskStatus, string> = {
  TODO: 'To do',
  IN_PROGRESS: 'In progress',
  BLOCKED: 'Blocked',
  COMPLETED: 'Completed',
  CANCELLED: 'Cancelled',
};

const TASK_PRIORITY_LABELS: Record<Priority, string> = {
  LOW: 'Low',
  MEDIUM: 'Medium',
  HIGH: 'High',
  CRITICAL: 'Critical',
};

export function formatTaskStatus(status: TaskStatus): string {
  return TASK_STATUS_LABELS[status];
}

export function formatTaskPriority(priority: Priority): string {
  return TASK_PRIORITY_LABELS[priority];
}

export function formatTaskDate(date: Date): string {
  return new Intl.DateTimeFormat(appConfig.defaultLocale, {
    dateStyle: 'medium',
  }).format(date);
}

export function formatOptionalTaskDate(date: Date | undefined): string {
  return date === undefined ? '—' : formatTaskDate(date);
}

export function shouldShowCreateTaskControl(canManageTasks: boolean): boolean {
  return canManageTasks;
}

export function getTaskDetailHref(
  projectIdValue: ProjectId,
  milestoneIdValue: MilestoneId,
  taskIdValue: TaskId,
): string {
  return taskRoute(projectIdValue, milestoneIdValue, taskIdValue);
}

export function getMilestoneTasksListHref(
  projectIdValue: ProjectId,
  milestoneIdValue: MilestoneId,
): string {
  return milestoneTasksRoute(projectIdValue, milestoneIdValue);
}

export function getNewTaskHref(
  projectIdValue: ProjectId,
  milestoneIdValue: MilestoneId,
): string {
  return newTaskRoute(projectIdValue, milestoneIdValue);
}

export function getMilestoneDetailHrefFromTasks(
  projectIdValue: ProjectId,
  milestoneIdValue: MilestoneId,
): string {
  return milestoneRoute(projectIdValue, milestoneIdValue);
}

export function getProjectDetailHrefFromTasks(projectIdValue: ProjectId): string {
  return projectRoute(projectIdValue);
}

export function parseTaskRouteParam(rawTaskId: string | undefined): TaskId | null {
  if (typeof rawTaskId !== 'string') {
    return null;
  }

  const normalized = rawTaskId.trim();
  if (!UUID_PATTERN.test(normalized)) {
    return null;
  }

  return taskId(normalized);
}

export function parseMilestoneRouteParamForTasks(
  rawMilestoneId: string | undefined,
): MilestoneId | null {
  if (typeof rawMilestoneId !== 'string') {
    return null;
  }

  const normalized = rawMilestoneId.trim();
  if (!UUID_PATTERN.test(normalized)) {
    return null;
  }

  return milestoneId(normalized);
}

export function parseProjectRouteParamForTasks(
  rawProjectId: string | undefined,
): ProjectId | null {
  if (typeof rawProjectId !== 'string') {
    return null;
  }

  const normalized = rawProjectId.trim();
  if (!UUID_PATTERN.test(normalized)) {
    return null;
  }

  return projectId(normalized);
}

export function formatTaskDateInputValue(value: string | undefined): string {
  if (value === undefined || value.trim().length === 0) {
    return '';
  }

  const normalized = value.trim();
  if (/^\d{4}-\d{2}-\d{2}$/.test(normalized)) {
    return normalized;
  }

  const parsed = new Date(normalized);
  if (Number.isNaN(parsed.getTime())) {
    return '';
  }

  return parsed.toISOString().slice(0, 10);
}

export interface TaskDetailBreadcrumbLinks {
  readonly projectHref: string;
  readonly projectLabel: string;
  readonly milestonesHref: string;
  readonly milestoneHref: string;
  readonly milestoneLabel: string;
  readonly tasksHref: string;
  readonly taskLabel?: string;
}

export function buildTaskDetailBreadcrumbLinks(input: {
  readonly projectId: ProjectId;
  readonly projectName: string;
  readonly milestoneId: MilestoneId;
  readonly milestoneName: string;
  readonly taskName?: string;
}): TaskDetailBreadcrumbLinks {
  return {
    projectHref: getProjectDetailHrefFromTasks(input.projectId),
    projectLabel: input.projectName,
    milestonesHref: `${projectRoute(input.projectId)}/milestones`,
    milestoneHref: getMilestoneDetailHrefFromTasks(input.projectId, input.milestoneId),
    milestoneLabel: input.milestoneName,
    tasksHref: getMilestoneTasksListHref(input.projectId, input.milestoneId),
    ...(input.taskName === undefined ? {} : { taskLabel: input.taskName }),
  };
}
