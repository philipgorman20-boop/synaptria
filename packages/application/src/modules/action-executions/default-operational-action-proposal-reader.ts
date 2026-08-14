import type { OrganizationId } from '@synaptria/core';
import type { OrganizationRole } from '@synaptria/core/context';

import {
  findAcceptedRecommendationIds,
  isRecommendationAccepted,
} from '../action-proposals/acceptance-gate';
import {
  buildActionProposalFromAcceptedRecommendation,
  isSupportedActionProposalRecommendation,
} from '../action-proposals/build-action-proposal-from-recommendation';
import { resolveActionProposalValidation } from '../action-proposals/resolve-action-proposal-validation';
import type { RecommendationReviewDecisionReader } from '../action-proposals/recommendation-review-decision-reader';
import type { RecommendationSnapshotReader } from '../action-proposals/recommendation-snapshot-reader';
import type { ActionProposalStateReaders } from '../action-proposals/state-readers/types';
import type {
  OperationalActionProposalReadResult,
  OperationalActionProposalReader,
} from './operational-action-proposal-reader';

export interface DefaultOperationalActionProposalReaderDependencies {
  readonly recommendationSnapshotReader: RecommendationSnapshotReader;
  readonly recommendationReviewDecisionReader: RecommendationReviewDecisionReader;
  readonly stateReaders: ActionProposalStateReaders;
}

export class DefaultOperationalActionProposalReader implements OperationalActionProposalReader {
  constructor(
    private readonly dependencies: DefaultOperationalActionProposalReaderDependencies,
  ) {}

  async loadOperationalProposal(
    context: {
      readonly organizationId: OrganizationId;
      readonly role: OrganizationRole;
    },
    recommendationId: string,
  ): Promise<OperationalActionProposalReadResult | null> {
    const recommendationsSnapshot =
      await this.dependencies.recommendationSnapshotReader.getRecommendations(context);

    const recommendation = recommendationsSnapshot.recommendations.find(
      (item) => item.id === recommendationId,
    );

    if (recommendation === undefined || !isSupportedActionProposalRecommendation(recommendation)) {
      return null;
    }

    const decisions =
      await this.dependencies.recommendationReviewDecisionReader.findByRecommendationIds(
        context.organizationId,
        [recommendationId],
      );

    const acceptedRecommendationIds = findAcceptedRecommendationIds(decisions);
    if (!isRecommendationAccepted(recommendationId, acceptedRecommendationIds)) {
      return null;
    }

    const built = await buildActionProposalFromAcceptedRecommendation(recommendation, {
      organizationId: context.organizationId,
      stateReaders: this.dependencies.stateReaders,
    });

    if (built === null || built.proposal.proposalKind !== 'OPERATIONAL') {
      return null;
    }

    const validation = await resolveActionProposalValidation(
      built.proposal,
      context.organizationId,
      this.dependencies.stateReaders,
    );

    return {
      proposal: built.proposal,
      validation,
    };
  }
}
