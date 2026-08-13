import {
  milestoneRoute,
  programRoute,
  projectRoute,
  routes,
  taskRoute,
} from '@synaptria/config';
import { appConfig } from '@synaptria/config';
import {
  milestoneId,
  projectId,
  taskId,
} from '@synaptria/core';
import type {
  DailyBriefingAttentionItem,
  DailyBriefingExecutiveSignals,
  DailyBriefingMetricValue,
  DailyBriefingNarrative,
  DailyBriefingNarrativeItem,
  DailyBriefingProjectHighlight,
  DailyBriefingRecentChange,
  DailyBriefingSnapshot,
  DailyBriefingUpcomingItem,
  GroundedNarrativeBlock,
} from '@synaptria/application';
import type {
  MissionControlRestrictedSlice,
} from '@synaptria/application/mission-control';

import {
  formatAttentionType,
  formatMissionControlDate,
  formatMissionControlDateTime,
  formatMissionControlSeverity,
  formatOptionalMissionControlDate,
  formatProjectHealthState,
  formatRestrictedSliceLabels,
  getAttentionItemHref,
} from '../dashboard/mission-control-format';

export const DAILY_BRIEFING_ROUTE = '/daily-briefing';

export const DAILY_BRIEFING_EMPTY_ATTENTION_MESSAGE =
  'No overdue, blocked, or due-soon work needs attention.';

export const DAILY_BRIEFING_EMPTY_HIGHLIGHTS_MESSAGE =
  'No project highlights in this briefing window.';

export const DAILY_BRIEFING_EMPTY_UPCOMING_MESSAGE =
  'No milestones or tasks are due soon in this briefing.';

export const DAILY_BRIEFING_EMPTY_RECENT_CHANGES_MESSAGE =
  'No organization changes recorded in this briefing window.';

export interface DailyBriefingExecutiveSignalDefinition {
  readonly key: keyof DailyBriefingExecutiveSignals;
  readonly label: string;
  readonly context: string;
}

export const DAILY_BRIEFING_EXECUTIVE_SIGNAL_DEFINITIONS: readonly DailyBriefingExecutiveSignalDefinition[] =
  [
    { key: 'activeProjects', label: 'Active projects', context: 'In flight' },
    { key: 'projectsAtRisk', label: 'Projects at risk', context: 'Needs review' },
    { key: 'overdueTasks', label: 'Overdue tasks', context: 'Needs action' },
    { key: 'blockedTasks', label: 'Blocked tasks', context: 'Execution stalled' },
    { key: 'overdueMilestones', label: 'Overdue milestones', context: 'Schedule risk' },
    { key: 'dueSoonMilestones', label: 'Due-soon milestones', context: 'Next week' },
    { key: 'dueSoonTasks', label: 'Due-soon tasks', context: 'Next week' },
    { key: 'recentOrganizationEvents', label: 'Recent changes', context: 'Briefing window' },
  ] as const;

const COMPLETENESS_LABELS: Record<DailyBriefingSnapshot['completeness']['status'], string> = {
  complete: 'Complete',
  degraded: 'Degraded',
  insufficient: 'Insufficient',
};

export function formatDailyBriefingWindow(snapshot: DailyBriefingSnapshot): string {
  const formatter = new Intl.DateTimeFormat(appConfig.defaultLocale, {
    dateStyle: 'medium',
    timeStyle: 'short',
  });

  return `${formatter.format(snapshot.briefingWindow.startsAt)} – ${formatter.format(snapshot.briefingWindow.endsAt)} (${snapshot.briefingWindow.lookbackHours}h lookback)`;
}

export function formatExecutiveSignalValue(value: DailyBriefingMetricValue): string {
  return value === null ? '—' : String(value);
}

export function isExecutiveSignalUnavailable(value: DailyBriefingMetricValue): boolean {
  return value === null;
}

export function formatCompletenessStatus(
  status: DailyBriefingSnapshot['completeness']['status'],
): string {
  return COMPLETENESS_LABELS[status];
}

export function formatEvidenceSourceCount(evidenceKeys: readonly string[]): string | null {
  if (evidenceKeys.length === 0) {
    return null;
  }

  return evidenceKeys.length === 1 ? '1 source' : `${evidenceKeys.length} sources`;
}

export function attentionEvidenceKey(item: DailyBriefingAttentionItem): string {
  return `entity:${item.entity.entityType}:${item.entity.entityId}`;
}

export function projectHighlightEvidenceKey(project: DailyBriefingProjectHighlight): string {
  return `entity:Project:${project.projectId}`;
}

export function upcomingWorkEvidenceKey(item: DailyBriefingUpcomingItem): string {
  return item.kind === 'milestone'
    ? `entity:Milestone:${item.entityId}`
    : `entity:Task:${item.entityId}`;
}

export function recentChangeEvidenceKey(change: DailyBriefingRecentChange): string {
  return `event:${change.eventId}`;
}

export function findNarrativeForEvidenceKey(
  items: readonly DailyBriefingNarrativeItem[],
  evidenceKey: string,
): DailyBriefingNarrativeItem | undefined {
  return items.find((item) => item.evidenceKeys.includes(evidenceKey));
}

export function getDailyBriefingRecentChangeHref(
  change: DailyBriefingRecentChange,
): string | null {
  switch (change.aggregateType) {
    case 'Program':
      return programRoute(change.aggregateId);
    case 'Project':
      return projectRoute(projectId(change.aggregateId));
    default:
      return null;
  }
}

export function getDailyBriefingUpcomingHref(item: DailyBriefingUpcomingItem): string | null {
  if (item.kind === 'milestone') {
    return milestoneRoute(projectId(item.projectId), milestoneId(item.entityId));
  }

  if (item.milestoneId === undefined) {
    return null;
  }

  return taskRoute(
    projectId(item.projectId),
    milestoneId(item.milestoneId),
    taskId(item.entityId),
  );
}

export function getDailyBriefingProjectHref(
  project: DailyBriefingProjectHighlight,
): string {
  return projectRoute(projectId(project.projectId));
}

export function shouldShowDailyBriefingEmptyState(snapshot: DailyBriefingSnapshot): boolean {
  if (snapshot.completeness.status === 'insufficient') {
    return false;
  }

  return (
    snapshot.attentionItems.length === 0 &&
    snapshot.projectHighlights.length === 0 &&
    snapshot.upcomingWork.length === 0 &&
    snapshot.recentChanges.length === 0 &&
    snapshot.executiveSignals.activeProjects === 0
  );
}

export function formatRestrictedSlicesForBriefing(
  slices: readonly MissionControlRestrictedSlice[],
): string {
  return formatRestrictedSliceLabels(slices);
}

export function resolveBriefingHeadline(
  narrative: DailyBriefingNarrative | null,
  snapshot: DailyBriefingSnapshot,
): string {
  if (narrative !== null) {
    return narrative.headline.text;
  }

  return snapshot.completeness.status === 'insufficient'
    ? 'Daily Briefing'
    : 'Operational briefing';
}

export function resolveExecutiveSummary(
  narrative: DailyBriefingNarrative | null,
): GroundedNarrativeBlock | null {
  return narrative?.executiveSummary ?? null;
}

export {
  formatAttentionType,
  formatMissionControlDate,
  formatMissionControlDateTime,
  formatMissionControlSeverity,
  formatOptionalMissionControlDate,
  formatProjectHealthState,
  getAttentionItemHref,
  routes,
};
