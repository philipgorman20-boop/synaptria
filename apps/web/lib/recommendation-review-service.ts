import {
  GetRecommendationReviewSnapshotUseCase,
  RecordRecommendationReviewDecisionUseCase,
  RecommendationReviewService,
  type RecommendationReviewTransactionRepositories,
  type RecommendationReviewUnitOfWork,
} from '@synaptria/application';
import { CryptoIdGenerator, SystemClock } from '@synaptria/core';
import {
  createPersistenceRepositories,
  db,
  withRecommendationReviewTransaction,
} from '@synaptria/database';

import { getRecommendationService } from './recommendation-service';

class PrismaRecommendationReviewUnitOfWork implements RecommendationReviewUnitOfWork {
  async execute<T>(
    operation: (repositories: RecommendationReviewTransactionRepositories) => Promise<T>,
  ): Promise<T> {
    return withRecommendationReviewTransaction(db, (repositories) => operation(repositories));
  }
}

const repositories = createPersistenceRepositories(db);
const clock = new SystemClock();
const eventIdGenerator = new CryptoIdGenerator();
const recommendationReviewUnitOfWork = new PrismaRecommendationReviewUnitOfWork();

const recommendationReviewService = new RecommendationReviewService(
  new GetRecommendationReviewSnapshotUseCase({
    recommendationService: getRecommendationService(),
    recommendationReviewDecisions: repositories.recommendationReviewDecisions,
  }),
  new RecordRecommendationReviewDecisionUseCase({
    recommendationService: getRecommendationService(),
    recommendationReviewUnitOfWork,
    clock,
    eventIdGenerator,
  }),
);

/** Shared application-service composition root for recommendation review. */
export function getRecommendationReviewService(): RecommendationReviewService {
  return recommendationReviewService;
}
