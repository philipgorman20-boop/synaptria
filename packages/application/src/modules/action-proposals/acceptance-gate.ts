import type { OrganizationId } from '@synaptria/core';

import type { RecommendationReviewDecision } from '@synaptria/domain/recommendation-reviews';

import type { Recommendation } from '../recommendations/types';
import { compareRecommendations } from '../recommendations/sort-recommendations';
import {
  buildActionProposalFromAcceptedRecommendation,
  isSupportedActionProposalRecommendation,
} from './build-action-proposal-from-recommendation';
import { resolveActionProposalValidation } from './resolve-action-proposal-validation';
import type { ActionProposalStateReaders } from './state-readers/types';
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

export async function buildActionProposalsFromAcceptedRecommendations(
  recommendations: readonly Recommendation[],
  organizationId: OrganizationId,
  stateReaders: ActionProposalStateReaders,
): Promise<readonly ActionProposalListItem[]> {
  const accepted = [...recommendations].sort(compareRecommendations);
  const items: ActionProposalListItem[] = [];

  for (const recommendation of accepted) {
    if (!isSupportedActionProposalRecommendation(recommendation)) {
      continue;
    }

    const built = await buildActionProposalFromAcceptedRecommendation(recommendation, {
      organizationId,
      stateReaders,
    });

    if (built === null) {
      continue;
    }

    const validation = await resolveActionProposalValidation(
      built.proposal,
      organizationId,
      stateReaders,
    );

    items.push({
      proposal: built.proposal,
      source: {
        recommendationId: recommendation.id,
        targetEntity: recommendation.targetEntity,
        evidence: recommendation.evidence,
      },
      validation,
    });
  }

  return items;
}

export function isRecommendationAccepted(
  recommendationId: string,
  acceptedRecommendationIds: ReadonlySet<string>,
): boolean {
  return acceptedRecommendationIds.has(recommendationId);
}
