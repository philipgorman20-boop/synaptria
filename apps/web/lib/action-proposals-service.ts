import {
  ActionProposalsService,
  GetActionProposalUseCase,
  GetActionProposalsUseCase,
} from '@synaptria/application';
import { createPersistenceRepositories, db } from '@synaptria/database';

import { getRecommendationService } from './recommendation-service';

const repositories = createPersistenceRepositories(db);

const actionProposalsService = new ActionProposalsService(
  new GetActionProposalsUseCase({
    recommendationSnapshotReader: getRecommendationService(),
    recommendationReviewDecisionReader: repositories.recommendationReviewDecisions,
  }),
  new GetActionProposalUseCase({
    recommendationSnapshotReader: getRecommendationService(),
    recommendationReviewDecisionReader: repositories.recommendationReviewDecisions,
  }),
);

/** Shared application-service composition root for action proposal inspection. */
export function getActionProposalsService(): ActionProposalsService {
  return actionProposalsService;
}
