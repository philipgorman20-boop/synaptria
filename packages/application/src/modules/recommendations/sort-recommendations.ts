import { RECOMMENDATION_PRIORITY_ORDER } from './constants';
import type { Recommendation } from './types';

const PRIORITY_RANK = new Map(
  RECOMMENDATION_PRIORITY_ORDER.map((priority, index) => [priority, index]),
);

export function compareRecommendations(left: Recommendation, right: Recommendation): number {
  const leftPriority = PRIORITY_RANK.get(left.priority) ?? RECOMMENDATION_PRIORITY_ORDER.length;
  const rightPriority = PRIORITY_RANK.get(right.priority) ?? RECOMMENDATION_PRIORITY_ORDER.length;

  if (leftPriority !== rightPriority) {
    return leftPriority - rightPriority;
  }

  const ruleCompare = left.ruleId.localeCompare(right.ruleId, 'en', { sensitivity: 'base' });
  if (ruleCompare !== 0) {
    return ruleCompare;
  }

  const leftTarget = `${left.targetEntity.entityType}:${left.targetEntity.entityId}`;
  const rightTarget = `${right.targetEntity.entityType}:${right.targetEntity.entityId}`;
  return leftTarget.localeCompare(rightTarget, 'en', { sensitivity: 'base' });
}

export function sortRecommendations(
  recommendations: readonly Recommendation[],
): readonly Recommendation[] {
  return [...recommendations].sort(compareRecommendations);
}
