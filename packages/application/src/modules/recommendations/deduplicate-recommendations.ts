import { entityEvidenceKey } from './evidence-keys';
import type { Recommendation } from './types';

export function deduplicateRecommendations(
  recommendations: readonly Recommendation[],
): readonly Recommendation[] {
  const seen = new Map<string, Recommendation>();

  for (const recommendation of recommendations) {
    const key = `${recommendation.ruleId}:${entityEvidenceKey(recommendation.targetEntity)}`;
    const existing = seen.get(key);
    if (existing === undefined) {
      seen.set(key, recommendation);
      continue;
    }

    if (compareRecommendationPriority(recommendation, existing) < 0) {
      seen.set(key, recommendation);
    }
  }

  return [...seen.values()];
}

function compareRecommendationPriority(left: Recommendation, right: Recommendation): number {
  const priorities = ['critical', 'high', 'medium', 'low'] as const;
  const leftIndex = priorities.indexOf(left.priority);
  const rightIndex = priorities.indexOf(right.priority);
  return leftIndex - rightIndex;
}
