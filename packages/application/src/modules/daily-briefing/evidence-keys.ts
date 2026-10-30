import type {
  DailyBriefingAttentionItem,
  DailyBriefingEvidenceItem,
  DailyBriefingProjectHighlight,
  DailyBriefingRecentChange,
  DailyBriefingUpcomingItem,
} from './types';

export function attentionItemEvidenceKey(item: DailyBriefingAttentionItem): string {
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

export function dailyBriefingEvidenceKey(item: DailyBriefingEvidenceItem): string {
  if (item.evidenceType === 'operationalEntity') {
    return `entity:${item.reference.entityType}:${item.reference.entityId}`;
  }

  return `event:${item.reference.eventId}`;
}

export function buildDailyBriefingEvidenceKeySet(
  evidence: readonly DailyBriefingEvidenceItem[],
): ReadonlySet<string> {
  return new Set(evidence.map(dailyBriefingEvidenceKey));
}
