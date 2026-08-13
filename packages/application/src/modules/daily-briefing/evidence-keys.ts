import type { DailyBriefingEvidenceItem } from './types';

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
