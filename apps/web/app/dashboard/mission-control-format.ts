import {
  milestoneRoute,
  programRoute,
  projectRoute,
  routes,
  taskRoute,
} from '@synaptria/config';
import {
  milestoneId,
  projectId,
  taskId,
} from '@synaptria/core';
import type {
  MissionControlAttentionItem,
  MissionControlAttentionType,
  MissionControlMilestoneSignal,
  MissionControlProjectHealth,
  MissionControlProjectHealthState,
  MissionControlRecentActivityItem,
  MissionControlRestrictedSlice,
  MissionControlSeverity,
  MissionControlSnapshot,
  MissionControlSummary,
  MissionControlTaskSignal,
} from '@synaptria/application/mission-control';
import { appConfig } from '@synaptria/config';
import type { MilestoneStatus } from '@synaptria/domain/milestones';
import type { Priority } from '@synaptria/domain/shared';
import type { TaskStatus } from '@synaptria/domain/tasks';

import { formatMilestoneStatus } from '../../lib/milestones-format';
import { formatTaskPriority, formatTaskStatus } from '../../lib/tasks-format';

export const MISSION_CONTROL_ATTENTION_LIMIT = 8;
export const MISSION_CONTROL_UPCOMING_LIMIT = 8;
export const MISSION_CONTROL_PROJECT_HEALTH_LIMIT = 8;
export const MISSION_CONTROL_RECENT_ACTIVITY_DISPLAY_LIMIT = 10;

export const MISSION_CONTROL_EMPTY_ATTENTION_MESSAGE =
  'No overdue, blocked, or due-soon work needs attention.';

export const MISSION_CONTROL_EMPTY_UPCOMING_MESSAGE =
  'No milestones or tasks are due within the next week.';

export const MISSION_CONTROL_EMPTY_PROJECT_HEALTH_MESSAGE =
  'No active projects to assess. Create a project to begin tracking execution health.';

export const MISSION_CONTROL_EMPTY_RECENT_ACTIVITY_MESSAGE =
  'No recent organization activity recorded yet.';

export const MISSION_CONTROL_RESTRICTED_NOTICE =
  'Some Mission Control data is unavailable because of your access permissions.';

export type MissionControlKpiKey = keyof Pick<
  MissionControlSummary,
  | 'activeProjects'
  | 'openMilestones'
  | 'overdueTasks'
  | 'blockedTasks'
  | 'recentActivityCount'
  | 'openTasks'
>;

export interface MissionControlKpiDefinition {
  readonly key: MissionControlKpiKey;
  readonly label: string;
  readonly context: string;
  readonly href: string | null;
  readonly restrictedSlice: MissionControlRestrictedSlice | null;
}

export const MISSION_CONTROL_KPI_DEFINITIONS: readonly MissionControlKpiDefinition[] = [
  {
    key: 'activeProjects',
    label: 'Active Projects',
    context: 'In flight',
    href: routes.projects,
    restrictedSlice: 'projects',
  },
  {
    key: 'openMilestones',
    label: 'Open Milestones',
    context: 'Across projects',
    href: routes.projects,
    restrictedSlice: 'milestones',
  },
  {
    key: 'overdueTasks',
    label: 'Overdue Tasks',
    context: 'Needs action',
    href: routes.projects,
    restrictedSlice: 'tasks',
  },
  {
    key: 'blockedTasks',
    label: 'Blocked Tasks',
    context: 'Execution stalled',
    href: routes.projects,
    restrictedSlice: 'tasks',
  },
  {
    key: 'recentActivityCount',
    label: 'Recent Activity',
    context: 'Latest events',
    href: null,
    restrictedSlice: 'recentActivity',
  },
  {
    key: 'openTasks',
    label: 'Open Tasks',
    context: 'In progress',
    href: routes.projects,
    restrictedSlice: 'tasks',
  },
] as const;

const SEVERITY_LABELS: Record<MissionControlSeverity, string> = {
  critical: 'Critical',
  high: 'High',
  medium: 'Medium',
  low: 'Low',
};

const ATTENTION_TYPE_LABELS: Record<MissionControlAttentionType, string> = {
  overdue_milestone: 'Overdue milestone',
  overdue_task: 'Overdue task',
  blocked_task: 'Blocked task',
  milestone_due_soon: 'Due soon',
  task_due_soon: 'Due soon',
  recent_significant_activity: 'Recent activity',
};

const HEALTH_STATE_LABELS: Record<MissionControlProjectHealthState, string> = {
  at_risk: 'At risk',
  watch: 'Watch',
  on_track: 'On track',
};

const RESTRICTED_SLICE_LABELS: Record<MissionControlRestrictedSlice, string> = {
  programs: 'programs',
  projects: 'projects',
  milestones: 'milestones',
  tasks: 'tasks',
  recentActivity: 'recent activity',
};

export type UpcomingWorkItem =
  | { readonly kind: 'milestone'; readonly signal: MissionControlMilestoneSignal }
  | { readonly kind: 'task'; readonly signal: MissionControlTaskSignal };

export function formatMissionControlSeverity(severity: MissionControlSeverity): string {
  return SEVERITY_LABELS[severity];
}

export function formatAttentionType(type: MissionControlAttentionType): string {
  return ATTENTION_TYPE_LABELS[type];
}

export function formatProjectHealthState(state: MissionControlProjectHealthState): string {
  return HEALTH_STATE_LABELS[state];
}

export function formatMissionControlDate(isoDate: string): string {
  return new Intl.DateTimeFormat(appConfig.defaultLocale, {
    dateStyle: 'medium',
  }).format(new Date(isoDate));
}

export function formatMissionControlDateTime(isoDate: string): string {
  return new Intl.DateTimeFormat(appConfig.defaultLocale, {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(new Date(isoDate));
}

export function formatOptionalMissionControlDate(isoDate: string | undefined): string {
  return isoDate === undefined ? '—' : formatMissionControlDate(isoDate);
}

export function formatEventTypeLabel(eventType: string): string {
  return eventType
    .split('.')
    .map((segment) => segment.replace(/_/g, ' '))
    .map((segment) => segment.charAt(0).toUpperCase() + segment.slice(1))
    .join(' · ');
}

export function formatAggregateTypeLabel(aggregateType: string): string {
  switch (aggregateType) {
    case 'Program':
      return 'Program';
    case 'Project':
      return 'Project';
    case 'Milestone':
      return 'Milestone';
    case 'Task':
      return 'Task';
    default:
      return aggregateType;
  }
}

export function formatRestrictedSliceLabels(
  slices: readonly MissionControlRestrictedSlice[],
): string {
  return slices.map((slice) => RESTRICTED_SLICE_LABELS[slice]).join(', ');
}

export function isSliceRestricted(
  slice: MissionControlRestrictedSlice,
  restrictedSlices: readonly MissionControlRestrictedSlice[],
): boolean {
  return restrictedSlices.includes(slice);
}

export function getKpiValue(
  summary: MissionControlSummary,
  key: MissionControlKpiKey,
): number {
  return summary[key];
}

export function getAttentionItemHref(item: MissionControlAttentionItem): string | null {
  switch (item.entity.entityType) {
    case 'Program':
      return programRoute(item.entity.entityId);
    case 'Project':
      return projectRoute(projectId(item.entity.entityId));
    case 'Milestone':
      return item.projectId === undefined
        ? null
        : milestoneRoute(projectId(item.projectId), milestoneId(item.entity.entityId));
    case 'Task':
      return item.projectId === undefined || item.milestoneId === undefined
        ? null
        : taskRoute(
            projectId(item.projectId),
            milestoneId(item.milestoneId),
            taskId(item.entity.entityId),
          );
    default:
      return null;
  }
}

export function getRecentActivityHref(
  item: MissionControlRecentActivityItem,
): string | null {
  switch (item.aggregateType) {
    case 'Program':
      return programRoute(item.aggregateId);
    case 'Project':
      return projectRoute(projectId(item.aggregateId));
    default:
      return null;
  }
}

export function getProjectHealthHref(
  projectHealth: MissionControlProjectHealth,
): string {
  return projectRoute(projectId(projectHealth.projectId));
}

export function getUpcomingMilestoneHref(signal: MissionControlMilestoneSignal): string {
  return milestoneRoute(projectId(signal.projectId), milestoneId(signal.milestoneId));
}

export function getUpcomingTaskHref(signal: MissionControlTaskSignal): string {
  return taskRoute(
    projectId(signal.projectId),
    milestoneId(signal.milestoneId),
    taskId(signal.taskId),
  );
}

export function buildUpcomingWorkItems(
  milestoneSignals: readonly MissionControlMilestoneSignal[],
  taskSignals: readonly MissionControlTaskSignal[],
  limit: number = MISSION_CONTROL_UPCOMING_LIMIT,
): readonly UpcomingWorkItem[] {
  const items: UpcomingWorkItem[] = [];

  for (const signal of milestoneSignals) {
    if (signal.dueSoon && !signal.overdue) {
      items.push({ kind: 'milestone', signal });
    }
  }

  for (const signal of taskSignals) {
    if (signal.dueSoon && !signal.overdue) {
      items.push({ kind: 'task', signal });
    }
  }

  items.sort((left, right) => {
    const leftDate =
      left.kind === 'milestone' ? left.signal.plannedEndDate : left.signal.plannedEndDate;
    const rightDate =
      right.kind === 'milestone' ? right.signal.plannedEndDate : right.signal.plannedEndDate;
    return compareOptionalIsoDates(leftDate, rightDate);
  });

  return items.slice(0, limit);
}

export function formatUpcomingEntityType(item: UpcomingWorkItem): string {
  return item.kind === 'milestone' ? 'Milestone' : 'Task';
}

export function formatUpcomingTitle(item: UpcomingWorkItem): string {
  return item.kind === 'milestone' ? item.signal.milestoneName : item.signal.taskName;
}

export function formatUpcomingContext(item: UpcomingWorkItem): string {
  if (item.kind === 'milestone') {
    return item.signal.projectName;
  }

  return `${item.signal.projectName} · ${item.signal.milestoneName}`;
}

export function formatUpcomingStatus(item: UpcomingWorkItem): string {
  if (item.kind === 'milestone') {
    return formatMilestoneStatus(item.signal.status as MilestoneStatus);
  }

  const status = formatTaskStatus(item.signal.status as TaskStatus);
  const priority = formatTaskPriority(item.signal.priority as Priority);
  return `${status} · ${priority}`;
}

export function getUpcomingItemHref(item: UpcomingWorkItem): string {
  return item.kind === 'milestone'
    ? getUpcomingMilestoneHref(item.signal)
    : getUpcomingTaskHref(item.signal);
}

export function formatUpcomingDueDate(item: UpcomingWorkItem): string {
  const isoDate =
    item.kind === 'milestone' ? item.signal.plannedEndDate : item.signal.plannedEndDate;
  return formatOptionalMissionControlDate(isoDate);
}

export function formatProjectHealthRiskSummary(
  projectHealth: MissionControlProjectHealth,
): string {
  const parts: string[] = [];

  if (projectHealth.overdueTasks > 0) {
    parts.push(
      projectHealth.overdueTasks === 1
        ? '1 overdue task'
        : `${projectHealth.overdueTasks} overdue tasks`,
    );
  }

  if (projectHealth.overdueMilestones > 0) {
    parts.push(
      projectHealth.overdueMilestones === 1
        ? '1 overdue milestone'
        : `${projectHealth.overdueMilestones} overdue milestones`,
    );
  }

  if (projectHealth.blockedTasks > 0) {
    parts.push(
      projectHealth.blockedTasks === 1
        ? '1 blocked task'
        : `${projectHealth.blockedTasks} blocked tasks`,
    );
  }

  if (parts.length === 0) {
    return 'No overdue or blocked work';
  }

  return parts.join(' · ');
}

export function shouldShowEmptyOrganizationState(
  snapshot: MissionControlSnapshot,
): boolean {
  const restricted = snapshot.metadata.restrictedSlices;

  if (
    isSliceRestricted('projects', restricted) ||
    isSliceRestricted('milestones', restricted) ||
    isSliceRestricted('tasks', restricted)
  ) {
    return false;
  }

  return (
    snapshot.summary.activeProjects === 0 &&
    snapshot.summary.openMilestones === 0 &&
    snapshot.summary.openTasks === 0
  );
}

export function getProjectHealthOverflowCount(
  projectHealth: readonly MissionControlProjectHealth[],
  limit: number = MISSION_CONTROL_PROJECT_HEALTH_LIMIT,
): number {
  return Math.max(projectHealth.length - limit, 0);
}

function compareOptionalIsoDates(
  left: string | undefined,
  right: string | undefined,
): number {
  if (left === undefined && right === undefined) {
    return 0;
  }

  if (left === undefined) {
    return 1;
  }

  if (right === undefined) {
    return -1;
  }

  return left.localeCompare(right, 'en', { sensitivity: 'base' });
}
