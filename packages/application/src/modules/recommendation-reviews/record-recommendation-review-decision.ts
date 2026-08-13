import type { Clock, IdGenerator } from '@synaptria/core';
import type {
  CorrelationId,
  MembershipId,
  OrganizationId,
  RequestId,
  UserId,
} from '@synaptria/core';
import type { OrganizationRole } from '@synaptria/core/context';
import {
  AuthorizationDeniedError,
} from '@synaptria/core/errors';
import { AuditService } from '@synaptria/audit';
import { DomainEventService } from '@synaptria/events';

import { ApplicationError } from '../../shared/application-error';
import type { RecommendationService } from '../recommendations/recommendations-service';
import {
  createDefaultRecommendationReviewAccessPolicy,
  type RecommendationReviewAccessPolicy,
} from './access-policy';
import type { RecommendationReviewDecisionType } from './constants';
import { toRecommendationReviewState } from './join-review-state';
import type { RecommendationReviewUnitOfWork } from './recommendation-review-unit-of-work';
import type { RecordRecommendationReviewDecisionResult } from './types';

export interface ReviewRecommendationContext {
  readonly organizationId: OrganizationId;
  readonly userId: UserId;
  readonly membershipId: MembershipId;
  readonly role: OrganizationRole;
  readonly requestId: RequestId;
  readonly correlationId: CorrelationId;
}

export interface RecordRecommendationReviewDecisionInput {
  readonly recommendationId: string;
  readonly decision: RecommendationReviewDecisionType;
  readonly dismissalReason?: string;
}

export interface RecordRecommendationReviewDecisionDependencies {
  readonly recommendationService: RecommendationService;
  readonly recommendationReviewUnitOfWork: RecommendationReviewUnitOfWork;
  readonly clock: Clock;
  readonly eventIdGenerator: IdGenerator;
  readonly accessPolicy?: RecommendationReviewAccessPolicy;
}

export class RecordRecommendationReviewDecisionUseCase {
  private readonly accessPolicy: RecommendationReviewAccessPolicy;

  constructor(
    private readonly dependencies: RecordRecommendationReviewDecisionDependencies,
  ) {
    this.accessPolicy =
      dependencies.accessPolicy ?? createDefaultRecommendationReviewAccessPolicy();
  }

  async execute(
    context: ReviewRecommendationContext,
    input: RecordRecommendationReviewDecisionInput,
  ): Promise<RecordRecommendationReviewDecisionResult> {
    if (!this.accessPolicy.canReviewRecommendations(context.role)) {
      throw new AuthorizationDeniedError('Recommendation review mutation denied.');
    }

    const recommendationId = input.recommendationId.trim();
    if (recommendationId.length === 0) {
      throw new ApplicationError({
        code: 'VALIDATION_FAILED',
        message: 'A recommendation ID is required.',
        details: { field: 'recommendationId' },
      });
    }

    const recommendationsSnapshot = await this.dependencies.recommendationService.getRecommendations(
      {
        organizationId: context.organizationId,
        role: context.role,
      },
    );

    const recommendation = recommendationsSnapshot.recommendations.find(
      (item) => item.id === recommendationId,
    );

    if (recommendation === undefined) {
      throw new ApplicationError({
        code: 'NOT_FOUND',
        message: 'The recommendation is not available in the current review queue.',
        details: { recommendationId },
      });
    }

    const reviewedAt = this.dependencies.clock.now();

    return this.dependencies.recommendationReviewUnitOfWork.execute(async (repositories) => {
      const existing = await repositories.recommendationReviewDecisions.findByRecommendationIds(
        context.organizationId,
        [recommendationId],
      );
      const current = existing[0];

      if (
        current !== undefined &&
        current.decision === input.decision &&
        (input.decision !== 'dismissed' ||
          (current.dismissalReason ?? null) === (input.dismissalReason ?? null))
      ) {
        return {
          recommendationId,
          review: toRecommendationReviewState(current),
          changed: false,
        };
      }

      const saved = await repositories.recommendationReviewDecisions.upsert({
        organizationId: context.organizationId,
        recommendationId,
        decision: input.decision,
        reviewedByUserId: context.userId,
        reviewedAt,
        ...(input.dismissalReason === undefined
          ? {}
          : { dismissalReason: input.dismissalReason }),
      });

      const audit = new AuditService(repositories.audit, this.dependencies.clock);
      await audit.record({
        organizationId: context.organizationId,
        actor: {
          type: 'USER',
          id: context.userId,
          userId: context.userId,
        },
        action: input.decision === 'accepted' ? 'APPROVE' : 'REJECT',
        target: {
          entityType: 'Recommendation',
          entityId: recommendationId,
        },
        request: {
          requestId: context.requestId,
          correlationId: context.correlationId,
        },
        before:
          current === undefined
            ? { reviewStatus: 'pending' }
            : {
                reviewStatus: current.decision,
                reviewedAt: current.reviewedAt.toISOString(),
                reviewedByUserId: current.reviewedByUserId,
              },
        after: {
          reviewStatus: saved.decision,
          reviewedAt: saved.reviewedAt.toISOString(),
          reviewedByUserId: saved.reviewedByUserId,
          recommendationType: recommendation.type,
        },
        metadata: {
          operation:
            input.decision === 'accepted'
              ? 'recommendation.review.accepted'
              : 'recommendation.review.dismissed',
        },
        occurredAt: reviewedAt,
      });

      const events = new DomainEventService(
        repositories.events,
        this.dependencies.clock,
        this.dependencies.eventIdGenerator,
      );

      await events.publish({
        context: {
          userId: context.userId,
          organizationId: context.organizationId,
          membershipId: context.membershipId,
          role: context.role,
          requestId: context.requestId,
          correlationId: context.correlationId,
        },
        event: {
          type:
            input.decision === 'accepted'
              ? 'recommendation.review.accepted'
              : 'recommendation.review.dismissed',
          aggregateType: 'Recommendation',
          aggregateId: recommendationId,
          payload: {
            recommendationId,
            recommendationType: recommendation.type,
            reviewStatus: saved.decision,
            reviewedByUserId: context.userId,
            targetEntityType: recommendation.targetEntity.entityType,
            targetEntityId: recommendation.targetEntity.entityId,
            ...(saved.dismissalReason === undefined
              ? {}
              : { dismissalReason: saved.dismissalReason }),
          },
          occurredAt: reviewedAt,
        },
      });

      return {
        recommendationId,
        review: toRecommendationReviewState(saved),
        changed: true,
      };
    });
  }
}
