import {
  ActionProposalsService,
  GetActionProposalUseCase,
  GetActionProposalsUseCase,
  createRepositoryActionProposalStateReaders,
} from '@synaptria/application';
import { createPersistenceRepositories, db } from '@synaptria/database';

import { getRecommendationService } from './recommendation-service';

const repositories = createPersistenceRepositories(db);
const stateReaders = createRepositoryActionProposalStateReaders(repositories);

const actionProposalsService = new ActionProposalsService(
  new GetActionProposalsUseCase({
    recommendationSnapshotReader: getRecommendationService(),
    recommendationReviewDecisionReader: repositories.recommendationReviewDecisions,
    stateReaders,
  }),
  new GetActionProposalUseCase({
    recommendationSnapshotReader: getRecommendationService(),
    recommendationReviewDecisionReader: repositories.recommendationReviewDecisions,
    stateReaders,
  }),
);

/** Shared application-service composition root for action proposal inspection. */
export function getActionProposalsService(): ActionProposalsService {
  return actionProposalsService;
}
