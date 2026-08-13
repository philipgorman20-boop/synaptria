import type { OrganizationId } from '@synaptria/core';
import type { OrganizationRole } from '@synaptria/core/context';
import { AuthorizationDeniedError } from '@synaptria/core/errors';
import type { RecommendationReviewDecisionRepository } from '@synaptria/domain/recommendation-reviews';

import type { RecommendationService } from '../recommendations/recommendations-service';
import {
  createDefaultRecommendationReviewAccessPolicy,
  type RecommendationReviewAccessPolicy,
} from './access-policy';
import {
  joinRecommendationsWithReviewDecisions,
  summarizeRecommendationReviewItems,
} from './join-review-state';
import type { RecommendationReviewSnapshot } from './types';

export interface GetRecommendationReviewSnapshotContext {
  readonly organizationId: OrganizationId;
  readonly role: OrganizationRole;
}

export interface GetRecommendationReviewSnapshotDependencies {
  readonly recommendationService: RecommendationService;
  readonly recommendationReviewDecisions: RecommendationReviewDecisionRepository;
  readonly accessPolicy?: RecommendationReviewAccessPolicy;
}

export class GetRecommendationReviewSnapshotUseCase {
  private readonly accessPolicy: RecommendationReviewAccessPolicy;

  constructor(private readonly dependencies: GetRecommendationReviewSnapshotDependencies) {
    this.accessPolicy =
      dependencies.accessPolicy ?? createDefaultRecommendationReviewAccessPolicy();
  }

  async execute(
    context: GetRecommendationReviewSnapshotContext,
  ): Promise<RecommendationReviewSnapshot> {
    if (!this.accessPolicy.canReadRecommendationReview(context.role)) {
      throw new AuthorizationDeniedError('Recommendation review access denied.');
    }

    const recommendationsSnapshot = await this.dependencies.recommendationService.getRecommendations(
      context,
    );

    const recommendationIds = recommendationsSnapshot.recommendations.map(
      (recommendation) => recommendation.id,
    );

    const decisions = await this.dependencies.recommendationReviewDecisions.findByRecommendationIds(
      context.organizationId,
      recommendationIds,
    );

    const items = joinRecommendationsWithReviewDecisions(
      recommendationsSnapshot.recommendations,
      decisions,
    );

    return {
      generatedAt: recommendationsSnapshot.generatedAt,
      organization: recommendationsSnapshot.organization,
      items,
      summary: summarizeRecommendationReviewItems(items),
      completeness: recommendationsSnapshot.completeness,
      metadata: recommendationsSnapshot.metadata,
    };
  }
}
