import type { OrganizationId, UserId } from '@synaptria/core';

import type { DailyBriefingCompleteness } from '../daily-briefing/types';
import type { MissionControlRestrictedSlice } from '../mission-control/constants';
import type { Recommendation } from '../recommendations/types';
import type { RecommendationReviewStatus } from './constants';

export interface RecommendationReviewState {
  readonly status: RecommendationReviewStatus;
  readonly reviewedAt?: Date;
  readonly reviewedBy?: UserId;
  readonly dismissalReason?: string;
}

export interface RecommendationReviewItem {
  readonly recommendation: Recommendation;
  readonly review: RecommendationReviewState;
}

export interface RecommendationReviewSummary {
  readonly pending: number;
  readonly accepted: number;
  readonly dismissed: number;
  readonly total: number;
}

export interface RecommendationReviewSnapshotMetadata {
  readonly deterministic: true;
  readonly restrictedSlices: readonly MissionControlRestrictedSlice[];
  readonly sourceSnapshotGeneratedAt: Date;
}

export interface RecommendationReviewSnapshot {
  readonly generatedAt: Date;
  readonly organization: {
    readonly organizationId: OrganizationId;
  };
  readonly items: readonly RecommendationReviewItem[];
  readonly summary: RecommendationReviewSummary;
  readonly completeness: DailyBriefingCompleteness;
  readonly metadata: RecommendationReviewSnapshotMetadata;
}

export interface RecordRecommendationReviewDecisionResult {
  readonly recommendationId: string;
  readonly review: RecommendationReviewState;
  readonly changed: boolean;
}
