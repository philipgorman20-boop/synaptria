import type { AuditRepository } from '@synaptria/audit';
import type { RecommendationReviewDecisionRepository } from '@synaptria/domain/recommendation-reviews';
import type { EventRepository } from '@synaptria/events';

/** Repositories that must participate in one atomic recommendation review transaction. */
export interface RecommendationReviewTransactionRepositories {
  readonly recommendationReviewDecisions: RecommendationReviewDecisionRepository;
  readonly audit: AuditRepository;
  readonly events: EventRepository;
}

/** Application-facing transaction boundary for recommendation review mutations. */
export interface RecommendationReviewUnitOfWork {
  execute<T>(
    operation: (repositories: RecommendationReviewTransactionRepositories) => Promise<T>,
  ): Promise<T>;
}
