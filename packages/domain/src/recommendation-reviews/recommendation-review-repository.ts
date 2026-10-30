import type { OrganizationId, UserId } from '@synaptria/core';

import type {
  RecommendationReviewDecision,
  RecommendationReviewDecisionValue,
} from './models';

export interface UpsertRecommendationReviewDecisionInput {
  readonly organizationId: OrganizationId;
  readonly recommendationId: string;
  readonly decision: RecommendationReviewDecisionValue;
  readonly reviewedByUserId: UserId;
  readonly reviewedAt: Date;
  readonly dismissalReason?: string;
}

export interface RecommendationReviewDecisionRepository {
  upsert(
    input: UpsertRecommendationReviewDecisionInput,
  ): Promise<RecommendationReviewDecision>;

  findByRecommendationIds(
    organizationId: OrganizationId,
    recommendationIds: readonly string[],
  ): Promise<readonly RecommendationReviewDecision[]>;
}
