import type { EntityReference } from '@synaptria/domain/context';

import { dailyBriefingEvidenceKey } from '../daily-briefing/evidence-keys';
import type { DailyBriefingEvidenceItem, DailyBriefingSnapshot } from '../daily-briefing/types';
import type { RecommendationEvidenceItem } from './types';

export function entityEvidenceKey(reference: EntityReference): string {
  return `entity:${reference.entityType}:${reference.entityId}`;
}

export function findSnapshotEvidenceForEntity(
  snapshot: DailyBriefingSnapshot,
  reference: EntityReference,
): readonly RecommendationEvidenceItem[] {
  const key = entityEvidenceKey(reference);
  return snapshot.evidence.filter((item) => dailyBriefingEvidenceKey(item) === key);
}

export function collectSnapshotEvidenceForEntities(
  snapshot: DailyBriefingSnapshot,
  references: readonly EntityReference[],
): readonly RecommendationEvidenceItem[] {
  const keys = new Set(references.map(entityEvidenceKey));
  const collected = new Map<string, DailyBriefingEvidenceItem>();

  for (const item of snapshot.evidence) {
    const key = dailyBriefingEvidenceKey(item);
    if (keys.has(key)) {
      collected.set(key, item);
    }
  }

  return [...collected.values()].sort((left, right) =>
    dailyBriefingEvidenceKey(left).localeCompare(dailyBriefingEvidenceKey(right), 'en', {
      sensitivity: 'base',
    }),
  );
}

export function buildRecommendationEvidenceKeySet(
  evidence: readonly RecommendationEvidenceItem[],
): ReadonlySet<string> {
  return new Set(evidence.map(dailyBriefingEvidenceKey));
}
