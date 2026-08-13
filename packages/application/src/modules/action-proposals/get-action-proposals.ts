import type { OrganizationId } from '@synaptria/core';
import type { OrganizationRole } from '@synaptria/core/context';
import { AuthorizationDeniedError } from '@synaptria/core/errors';

import { ApplicationError } from '../../shared/application-error';
import {
  buildActionProposalsFromAcceptedRecommendations,
  findAcceptedRecommendationIds,
  isRecommendationAccepted,
  selectAcceptedRecommendations,
} from './acceptance-gate';
import {
  createDefaultActionProposalsAccessPolicy,
  type ActionProposalsAccessPolicy,
} from './access-policy';
import {
  buildActionProposalFromRecommendation,
  buildUnsupportedActionProposalResult,
  isSupportedActionProposalRecommendation,
} from './build-action-proposal-from-recommendation';
import type { RecommendationSnapshotReader } from './recommendation-snapshot-reader';
import type { RecommendationReviewDecisionReader } from './recommendation-review-decision-reader';
import type { ActionProposalLookupResult, ActionProposalsSnapshot } from './types';

export interface GetActionProposalsContext {
  readonly organizationId: OrganizationId;
  readonly role: OrganizationRole;
}

export interface GetActionProposalsDependencies {
  readonly recommendationSnapshotReader: RecommendationSnapshotReader;
  readonly recommendationReviewDecisionReader: RecommendationReviewDecisionReader;
  readonly accessPolicy?: ActionProposalsAccessPolicy;
}

export class GetActionProposalsUseCase {
  private readonly accessPolicy: ActionProposalsAccessPolicy;

  constructor(private readonly dependencies: GetActionProposalsDependencies) {
    this.accessPolicy =
      dependencies.accessPolicy ?? createDefaultActionProposalsAccessPolicy();
  }

  async execute(context: GetActionProposalsContext): Promise<ActionProposalsSnapshot> {
    if (!this.accessPolicy.canReadActionProposals(context.role)) {
      throw new AuthorizationDeniedError('Action proposals access denied.');
    }

    const recommendationsSnapshot =
      await this.dependencies.recommendationSnapshotReader.getRecommendations(context);

    const recommendationIds = recommendationsSnapshot.recommendations.map(
      (recommendation) => recommendation.id,
    );

    const decisions =
      await this.dependencies.recommendationReviewDecisionReader.findByRecommendationIds(
        context.organizationId,
        recommendationIds,
      );

    const acceptedRecommendationIds = findAcceptedRecommendationIds(decisions);
    const acceptedRecommendations = selectAcceptedRecommendations(
      recommendationsSnapshot.recommendations,
      acceptedRecommendationIds,
    );

    const proposals = buildActionProposalsFromAcceptedRecommendations(acceptedRecommendations);

    return {
      generatedAt: recommendationsSnapshot.generatedAt,
      organization: recommendationsSnapshot.organization,
      proposals,
      completeness: recommendationsSnapshot.completeness,
      metadata: {
        deterministic: true,
        restrictedSlices: recommendationsSnapshot.metadata.restrictedSlices,
        sourceSnapshotGeneratedAt: recommendationsSnapshot.metadata.sourceSnapshotGeneratedAt,
      },
    };
  }
}

export interface GetActionProposalDependencies {
  readonly recommendationSnapshotReader: RecommendationSnapshotReader;
  readonly recommendationReviewDecisionReader: RecommendationReviewDecisionReader;
  readonly accessPolicy?: ActionProposalsAccessPolicy;
}

export class GetActionProposalUseCase {
  private readonly accessPolicy: ActionProposalsAccessPolicy;

  constructor(private readonly dependencies: GetActionProposalDependencies) {
    this.accessPolicy =
      dependencies.accessPolicy ?? createDefaultActionProposalsAccessPolicy();
  }

  async execute(
    context: GetActionProposalsContext,
    recommendationId: string,
  ): Promise<ActionProposalLookupResult> {
    if (!this.accessPolicy.canReadActionProposals(context.role)) {
      throw new AuthorizationDeniedError('Action proposals access denied.');
    }

    const normalizedRecommendationId = recommendationId.trim();
    if (normalizedRecommendationId.length === 0) {
      throw new ApplicationError({
        code: 'VALIDATION_FAILED',
        message: 'A recommendation ID is required.',
        details: { field: 'recommendationId' },
      });
    }

    const recommendationsSnapshot =
      await this.dependencies.recommendationSnapshotReader.getRecommendations(context);

    const recommendation = recommendationsSnapshot.recommendations.find(
      (item) => item.id === normalizedRecommendationId,
    );

    if (recommendation === undefined) {
      throw new ApplicationError({
        code: 'NOT_FOUND',
        message: 'The recommendation is not available in the current deterministic snapshot.',
        details: { recommendationId: normalizedRecommendationId },
      });
    }

    const decisions =
      await this.dependencies.recommendationReviewDecisionReader.findByRecommendationIds(
        context.organizationId,
        [normalizedRecommendationId],
      );

    const acceptedRecommendationIds = findAcceptedRecommendationIds(decisions);
    if (!isRecommendationAccepted(normalizedRecommendationId, acceptedRecommendationIds)) {
      throw new ApplicationError({
        code: 'NOT_FOUND',
        message: 'Action proposals require an accepted recommendation review decision.',
        details: { recommendationId: normalizedRecommendationId },
      });
    }

    if (!isSupportedActionProposalRecommendation(recommendation)) {
      return buildUnsupportedActionProposalResult(
        normalizedRecommendationId,
        'This recommendation type does not support action proposal generation.',
      );
    }

    const proposal = buildActionProposalFromRecommendation(recommendation);
    if (proposal === null) {
      return buildUnsupportedActionProposalResult(
        normalizedRecommendationId,
        'Insufficient evidence to construct an action proposal.',
      );
    }

    return proposal;
  }
}
