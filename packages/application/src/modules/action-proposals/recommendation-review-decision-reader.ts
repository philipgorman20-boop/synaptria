import type { OrganizationId } from '@synaptria/core';
import type { RecommendationReviewDecision } from '@synaptria/domain/recommendation-reviews';

/** Minimal read contract for persisted recommendation review decisions. */
export interface RecommendationReviewDecisionReader {
  findByRecommendationIds(
    organizationId: OrganizationId,
    recommendationIds: readonly string[],
  ): Promise<readonly RecommendationReviewDecision[]>;
}
