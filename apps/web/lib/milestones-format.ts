import type {
  MilestonePriority,
  MilestoneStatus,
} from '@synaptria/domain/milestones';
import { appConfig, milestoneRoute, newMilestoneRoute, projectMilestonesRoute, projectRoute } from '@synaptria/config';
import { milestoneId, projectId, type MilestoneId, type ProjectId } from '@synaptria/core';

const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

const MILESTONE_STATUS_LABELS: Record<MilestoneStatus, string> = {
  PLANNED: 'Planned',
  IN_PROGRESS: 'In progress',
  BLOCKED: 'Blocked',
  COMPLETED: 'Completed',
  CANCELLED: 'Cancelled',
};

const MILESTONE_PRIORITY_LABELS: Record<MilestonePriority, string> = {
  LOW: 'Low',
  MEDIUM: 'Medium',
  HIGH: 'High',
  CRITICAL: 'Critical',
};

export function formatMilestoneStatus(status: MilestoneStatus): string {
  return MILESTONE_STATUS_LABELS[status];
}

export function formatMilestonePriority(priority: MilestonePriority): string {
  return MILESTONE_PRIORITY_LABELS[priority];
}

export function formatMilestoneDate(date: Date): string {
  return new Intl.DateTimeFormat(appConfig.defaultLocale, {
    dateStyle: 'medium',
  }).format(date);
}

export function formatOptionalMilestoneDate(date: Date | undefined): string {
  return date === undefined ? '—' : formatMilestoneDate(date);
}

export function shouldShowCreateMilestoneControl(
  canManageMilestones: boolean,
): boolean {
  return canManageMilestones;
}

export function getMilestoneDetailHref(
  projectIdValue: ProjectId,
  milestoneIdValue: MilestoneId,
): string {
  return milestoneRoute(projectIdValue, milestoneIdValue);
}

export function getProjectMilestonesListHref(projectIdValue: ProjectId): string {
  return projectMilestonesRoute(projectIdValue);
}

export function getNewMilestoneHref(projectIdValue: ProjectId): string {
  return newMilestoneRoute(projectIdValue);
}

export function getProjectDetailHrefFromMilestones(projectIdValue: ProjectId): string {
  return projectRoute(projectIdValue);
}

export function parseMilestoneRouteParam(
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

export function parseProjectRouteParamForMilestones(
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

export function formatMilestoneDateInputValue(value: string | undefined): string {
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

export interface MilestoneDetailBreadcrumbLinks {
  readonly projectHref: string;
  readonly projectLabel: string;
  readonly milestonesHref: string;
  readonly milestoneLabel?: string;
}

export function buildMilestoneDetailBreadcrumbLinks(input: {
  readonly projectId: ProjectId;
  readonly projectName: string;
  readonly milestoneName?: string;
}): MilestoneDetailBreadcrumbLinks {
  return {
    projectHref: getProjectDetailHrefFromMilestones(input.projectId),
    projectLabel: input.projectName,
    milestonesHref: getProjectMilestonesListHref(input.projectId),
    ...(input.milestoneName === undefined
      ? {}
      : { milestoneLabel: input.milestoneName }),
  };
}
