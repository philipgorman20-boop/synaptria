import type { RecommendationReviewDecision } from '@synaptria/domain/recommendation-reviews';

import type { Recommendation } from '../recommendations/types';
import { compareRecommendations } from '../recommendations/sort-recommendations';
import {
  buildActionProposalFromRecommendation,
  isSupportedActionProposalRecommendation,
} from './build-action-proposal-from-recommendation';
import type { ActionProposalListItem } from './types';

export function findAcceptedRecommendationIds(
  decisions: readonly RecommendationReviewDecision[],
): ReadonlySet<string> {
  return new Set(
    decisions
      .filter((decision) => decision.decision === 'accepted')
      .map((decision) => decision.recommendationId),
  );
}

export function selectAcceptedRecommendations(
  recommendations: readonly Recommendation[],
  acceptedRecommendationIds: ReadonlySet<string>,
): readonly Recommendation[] {
  return recommendations.filter((recommendation) =>
    acceptedRecommendationIds.has(recommendation.id),
  );
}

export function buildActionProposalsFromAcceptedRecommendations(
  recommendations: readonly Recommendation[],
): readonly ActionProposalListItem[] {
  const accepted = [...recommendations].sort(compareRecommendations);

  return accepted
    .filter(isSupportedActionProposalRecommendation)
    .map((recommendation) => {
      const proposal = buildActionProposalFromRecommendation(recommendation);
      if (proposal === null) {
        return null;
      }

      return {
        proposal,
        source: {
          recommendationId: recommendation.id,
          targetEntity: recommendation.targetEntity,
          evidence: recommendation.evidence,
        },
      };
    })
    .filter((item): item is ActionProposalListItem => item !== null);
}

export function isRecommendationAccepted(
  recommendationId: string,
  acceptedRecommendationIds: ReadonlySet<string>,
): boolean {
  return acceptedRecommendationIds.has(recommendationId);
}
