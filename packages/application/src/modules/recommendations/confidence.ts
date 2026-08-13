import type { DailyBriefingCompletenessStatus } from '../daily-briefing/constants';
import type { RecommendationConfidence } from './constants';

export function calculateRecommendationConfidence(input: {
  readonly evidenceCount: number;
  readonly corroboratingSignalCount: number;
  readonly completenessStatus: DailyBriefingCompletenessStatus;
}): RecommendationConfidence {
  if (input.evidenceCount === 0) {
    return 'low';
  }

  if (input.completenessStatus === 'insufficient') {
    return 'low';
  }

  if (input.completenessStatus === 'degraded') {
    return input.corroboratingSignalCount >= 2 ? 'medium' : 'low';
  }

  if (input.corroboratingSignalCount >= 2 && input.evidenceCount >= 2) {
    return 'high';
  }

  if (input.corroboratingSignalCount >= 1) {
    return 'medium';
  }

  return 'low';
}
