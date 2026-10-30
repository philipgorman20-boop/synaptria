export const RECOMMENDATION_REVIEW_STATUSES = ['pending', 'accepted', 'dismissed'] as const;

export type RecommendationReviewStatus =
  (typeof RECOMMENDATION_REVIEW_STATUSES)[number];

export const RECOMMENDATION_REVIEW_DECISIONS = ['accepted', 'dismissed'] as const;

export type RecommendationReviewDecisionType =
  (typeof RECOMMENDATION_REVIEW_DECISIONS)[number];
