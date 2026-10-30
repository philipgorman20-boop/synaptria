import type { GetRecommendationReviewSnapshotUseCase } from './get-recommendation-review-snapshot';
import type {
  GetRecommendationReviewSnapshotContext,
} from './get-recommendation-review-snapshot';
import type {
  RecordRecommendationReviewDecisionInput,
  RecordRecommendationReviewDecisionUseCase,
  ReviewRecommendationContext,
} from './record-recommendation-review-decision';

export class RecommendationReviewService {
  constructor(
    private readonly getRecommendationReviewSnapshotUseCase: GetRecommendationReviewSnapshotUseCase,
    private readonly recordRecommendationReviewDecisionUseCase: RecordRecommendationReviewDecisionUseCase,
  ) {}

  getReviewSnapshot(context: GetRecommendationReviewSnapshotContext) {
    return this.getRecommendationReviewSnapshotUseCase.execute(context);
  }

  acceptRecommendation(
    context: ReviewRecommendationContext,
    input: Pick<RecordRecommendationReviewDecisionInput, 'recommendationId'>,
  ) {
    return this.recordRecommendationReviewDecisionUseCase.execute(context, {
      recommendationId: input.recommendationId,
      decision: 'accepted',
    });
  }

  dismissRecommendation(
    context: ReviewRecommendationContext,
    input: Pick<RecordRecommendationReviewDecisionInput, 'recommendationId' | 'dismissalReason'>,
  ) {
    return this.recordRecommendationReviewDecisionUseCase.execute(context, {
      recommendationId: input.recommendationId,
      decision: 'dismissed',
      ...(input.dismissalReason === undefined ? {} : { dismissalReason: input.dismissalReason }),
    });
  }
}

export type {
  GetRecommendationReviewSnapshotContext,
  ReviewRecommendationContext,
};
