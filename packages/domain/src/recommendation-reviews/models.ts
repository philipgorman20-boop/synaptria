import type { OrganizationId, UserId } from '@synaptria/core';

export const RECOMMENDATION_REVIEW_DECISIONS = ['accepted', 'dismissed'] as const;

export type RecommendationReviewDecisionValue =
  (typeof RECOMMENDATION_REVIEW_DECISIONS)[number];

export interface RecommendationReviewDecision {
  readonly id: string;
  readonly organizationId: OrganizationId;
  readonly recommendationId: string;
  readonly decision: RecommendationReviewDecisionValue;
  readonly reviewedByUserId: UserId;
  readonly reviewedAt: Date;
  readonly dismissalReason?: string;
}
