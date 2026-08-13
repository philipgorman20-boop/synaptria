import type { RecommendationReviewDecision } from '@synaptria/domain/recommendation-reviews';

import type { Recommendation } from '../recommendations/types';
import type { RecommendationReviewItem, RecommendationReviewSummary } from './types';

function mapDecisionToReviewState(
  decision: RecommendationReviewDecision,
): RecommendationReviewItem['review'] {
  return {
    status: decision.decision,
    reviewedAt: decision.reviewedAt,
    reviewedBy: decision.reviewedByUserId,
    ...(decision.dismissalReason === undefined
      ? {}
      : { dismissalReason: decision.dismissalReason }),
  };
}

export function joinRecommendationsWithReviewDecisions(
  recommendations: readonly Recommendation[],
  decisions: readonly RecommendationReviewDecision[],
): readonly RecommendationReviewItem[] {
  const decisionByRecommendationId = new Map(
    decisions.map((decision) => [decision.recommendationId, decision]),
  );

  return recommendations.map((recommendation) => {
    const decision = decisionByRecommendationId.get(recommendation.id);

    return {
      recommendation,
      review:
        decision === undefined
          ? { status: 'pending' }
          : mapDecisionToReviewState(decision),
    };
  });
}

export function summarizeRecommendationReviewItems(
  items: readonly RecommendationReviewItem[],
): RecommendationReviewSummary {
  let pending = 0;
  let accepted = 0;
  let dismissed = 0;

  for (const item of items) {
    switch (item.review.status) {
      case 'pending':
        pending += 1;
        break;
      case 'accepted':
        accepted += 1;
        break;
      case 'dismissed':
        dismissed += 1;
        break;
    }
  }

  return {
    pending,
    accepted,
    dismissed,
    total: items.length,
  };
}

export function toRecommendationReviewState(
  decision: RecommendationReviewDecision,
): RecommendationReviewItem['review'] {
  return mapDecisionToReviewState(decision);
}
