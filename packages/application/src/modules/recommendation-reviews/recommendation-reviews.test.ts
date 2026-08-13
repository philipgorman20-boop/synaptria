import assert from 'node:assert/strict';
import test from 'node:test';

import { identifier, organizationId, userId } from '@synaptria/core';
import { AuthorizationDeniedError } from '@synaptria/core/errors';
import type {
  RecommendationReviewDecision,
  RecommendationReviewDecisionRepository,
  UpsertRecommendationReviewDecisionInput,
} from '@synaptria/domain/recommendation-reviews';

import { dailyBriefingSnapshotFixture } from '../daily-briefing/narrative/testing/fixtures';
import { generateRecommendationsFromDailyBriefingSnapshot } from '../recommendations/generate-recommendations';
import type { RecommendationService } from '../recommendations/recommendations-service';
import { GetRecommendationReviewSnapshotUseCase } from './get-recommendation-review-snapshot';
import {
  joinRecommendationsWithReviewDecisions,
  summarizeRecommendationReviewItems,
} from './join-review-state';
import { RecordRecommendationReviewDecisionUseCase } from './record-recommendation-review-decision';
import type { RecommendationReviewUnitOfWork } from './recommendation-review-unit-of-work';
import { RecommendationReviewService } from './recommendation-review-service';

const ORGANIZATION_ID = organizationId('org-1');
const OTHER_ORGANIZATION_ID = organizationId('org-2');
const USER_ID = userId('user-1');
const MEMBERSHIP_ID = identifier('membership-1', 'MembershipId');
const REQUEST_ID = identifier('request-1', 'RequestId');
const CORRELATION_ID = identifier('correlation-1', 'CorrelationId');
const REVIEWED_AT = new Date('2026-07-26T14:00:00.000Z');

const READ_CONTEXT = { organizationId: ORGANIZATION_ID, role: 'MEMBER' as const };
const REVIEW_MUTATION_CONTEXT = {
  organizationId: ORGANIZATION_ID,
  userId: USER_ID,
  membershipId: MEMBERSHIP_ID,
  role: 'ADMIN' as const,
  requestId: REQUEST_ID,
  correlationId: CORRELATION_ID,
};

class InMemoryRecommendationReviewDecisionRepository
  implements RecommendationReviewDecisionRepository
{
  private readonly records = new Map<string, RecommendationReviewDecision>();

  private key(organizationId: string, recommendationId: string): string {
    return `${organizationId}:${recommendationId}`;
  }

  async upsert(
    input: UpsertRecommendationReviewDecisionInput,
  ): Promise<RecommendationReviewDecision> {
    const record: RecommendationReviewDecision = {
      id: `decision-${this.records.size + 1}`,
      organizationId: input.organizationId,
      recommendationId: input.recommendationId,
      decision: input.decision,
      reviewedByUserId: input.reviewedByUserId,
      reviewedAt: input.reviewedAt,
      ...(input.dismissalReason === undefined ? {} : { dismissalReason: input.dismissalReason }),
    };
    this.records.set(this.key(input.organizationId, input.recommendationId), record);
    return record;
  }

  async findByRecommendationIds(
    organizationId: string,
    recommendationIds: readonly string[],
  ): Promise<readonly RecommendationReviewDecision[]> {
    return recommendationIds
      .map((recommendationId) => this.records.get(this.key(organizationId, recommendationId)))
      .filter((record): record is RecommendationReviewDecision => record !== undefined);
  }

  seed(record: RecommendationReviewDecision): void {
    this.records.set(this.key(record.organizationId, record.recommendationId), record);
  }
}

function blockedTaskRecommendationsSnapshot() {
  return generateRecommendationsFromDailyBriefingSnapshot(
    dailyBriefingSnapshotFixture({
      attentionItems: [
        {
          type: 'blocked_task',
          severity: 'critical',
          entity: { entityType: 'Task', entityId: 'task-blocked' },
          title: 'Assay transfer',
          reason: 'Task is blocked by an external dependency.',
          projectId: 'project-1',
        },
      ],
      projectHighlights: [
        {
          projectId: 'project-1',
          projectName: 'Alpha Study',
          healthState: 'at_risk',
          attentionSeverity: 'high',
          overdueTasks: 0,
          blockedTasks: 1,
          overdueMilestones: 0,
          dueSoonMilestones: 0,
          dueSoonTasks: 0,
          recentEventCount: 1,
        },
      ],
      evidence: [
        {
          evidenceType: 'operationalEntity',
          reference: {
            organizationId: ORGANIZATION_ID,
            entityType: 'Task',
            entityId: 'task-blocked',
          },
          source: 'missionControl',
        },
        {
          evidenceType: 'operationalEntity',
          reference: {
            organizationId: ORGANIZATION_ID,
            entityType: 'Project',
            entityId: 'project-1',
          },
          source: 'missionControl',
        },
      ],
    }),
  );
}

function createRecommendationService(
  snapshot = blockedTaskRecommendationsSnapshot(),
): RecommendationService {
  return {
    getRecommendations: async () => snapshot,
  } as unknown as RecommendationService;
}

function createSilentReviewUnitOfWork(
  repository: InMemoryRecommendationReviewDecisionRepository,
): RecommendationReviewUnitOfWork {
  return {
    execute: async (operation) =>
      operation({
        recommendationReviewDecisions: repository,
        audit: {
          create: async (input) =>
            ({
              id: 'audit-1',
              organizationId: input.organizationId,
              actor: input.actor,
              action: input.action,
              target: input.target,
              occurredAt: input.occurredAt ?? REVIEWED_AT,
            }) as never,
        },
        events: {
          append: async (input) => input,
          appendMany: async (inputs) => inputs,
          findById: async () => null,
          findByAggregate: async () => [],
          listRecentForOrganization: async () => [],
          updateStatus: async (input) => input as never,
        },
      }),
  };
}

function createAuditEventsUnitOfWork(
  repository: InMemoryRecommendationReviewDecisionRepository,
  auditCalls: unknown[],
  eventCalls: unknown[],
): RecommendationReviewUnitOfWork {
  return {
    execute: async (operation) =>
      operation({
        recommendationReviewDecisions: repository,
        audit: {
          create: async (input) => {
            auditCalls.push(input);
            return {
              id: 'audit-1',
              organizationId: input.organizationId,
              actor: input.actor,
              action: input.action,
              target: input.target,
              occurredAt: input.occurredAt ?? REVIEWED_AT,
            } as never;
          },
        },
        events: {
          append: async (input) => {
            eventCalls.push(input);
            return input;
          },
          appendMany: async (inputs) => inputs,
          findById: async () => null,
          findByAggregate: async () => [],
          listRecentForOrganization: async () => [],
          updateStatus: async (input) => input as never,
        },
      }),
  };
}

const TEST_EVENT_ID_GENERATOR = { generate: () => 'event-1' };

test('current recommendations default to pending review state', async () => {
  const repository = new InMemoryRecommendationReviewDecisionRepository();
  const useCase = new GetRecommendationReviewSnapshotUseCase({
    recommendationService: createRecommendationService(),
    recommendationReviewDecisions: repository,
  });

  const snapshot = await useCase.execute(READ_CONTEXT);

  assert.equal(snapshot.items.length, 1);
  assert.equal(snapshot.items[0]?.review.status, 'pending');
  assert.equal(snapshot.summary.pending, 1);
});

test('persisted accepted decision is joined onto the current recommendation', async () => {
  const recommendations = blockedTaskRecommendationsSnapshot();
  const recommendationId = recommendations.recommendations[0]?.id;
  assert.ok(recommendationId);

  const repository = new InMemoryRecommendationReviewDecisionRepository();
  repository.seed({
    id: 'decision-1',
    organizationId: ORGANIZATION_ID,
    recommendationId,
    decision: 'accepted',
    reviewedByUserId: USER_ID,
    reviewedAt: REVIEWED_AT,
  });

  const snapshot = await new GetRecommendationReviewSnapshotUseCase({
    recommendationService: createRecommendationService(recommendations),
    recommendationReviewDecisions: repository,
  }).execute(READ_CONTEXT);

  assert.equal(snapshot.items[0]?.review.status, 'accepted');
  assert.equal(snapshot.items[0]?.review.reviewedBy, USER_ID);
  assert.equal(snapshot.summary.accepted, 1);
});

test('persisted dismissed decision is joined onto the current recommendation', async () => {
  const recommendations = blockedTaskRecommendationsSnapshot();
  const recommendationId = recommendations.recommendations[0]?.id;
  assert.ok(recommendationId);

  const repository = new InMemoryRecommendationReviewDecisionRepository();
  repository.seed({
    id: 'decision-1',
    organizationId: ORGANIZATION_ID,
    recommendationId,
    decision: 'dismissed',
    reviewedByUserId: USER_ID,
    reviewedAt: REVIEWED_AT,
    dismissalReason: 'Already handled offline',
  });

  const snapshot = await new GetRecommendationReviewSnapshotUseCase({
    recommendationService: createRecommendationService(recommendations),
    recommendationReviewDecisions: repository,
  }).execute(READ_CONTEXT);

  assert.equal(snapshot.items[0]?.review.status, 'dismissed');
  assert.equal(snapshot.items[0]?.review.dismissalReason, 'Already handled offline');
});

test('review decisions are organization-scoped when loading', async () => {
  const recommendations = blockedTaskRecommendationsSnapshot();
  const recommendationId = recommendations.recommendations[0]?.id;
  assert.ok(recommendationId);

  const repository = new InMemoryRecommendationReviewDecisionRepository();
  repository.seed({
    id: 'decision-1',
    organizationId: OTHER_ORGANIZATION_ID,
    recommendationId,
    decision: 'accepted',
    reviewedByUserId: USER_ID,
    reviewedAt: REVIEWED_AT,
  });

  const items = joinRecommendationsWithReviewDecisions(recommendations.recommendations, []);
  assert.equal(items[0]?.review.status, 'pending');
});

test('accepting a recommendation is idempotent', async () => {
  const repository = new InMemoryRecommendationReviewDecisionRepository();
  const recommendations = blockedTaskRecommendationsSnapshot();
  const recommendationId = recommendations.recommendations[0]?.id;
  assert.ok(recommendationId);

  const useCase = new RecordRecommendationReviewDecisionUseCase({
    recommendationService: createRecommendationService(recommendations),
    recommendationReviewUnitOfWork: createSilentReviewUnitOfWork(repository),
    clock: { now: () => REVIEWED_AT },
    eventIdGenerator: TEST_EVENT_ID_GENERATOR,
  });

  const first = await useCase.execute(REVIEW_MUTATION_CONTEXT, {
    recommendationId,
    decision: 'accepted',
  });
  const second = await useCase.execute(REVIEW_MUTATION_CONTEXT, {
    recommendationId,
    decision: 'accepted',
  });

  assert.equal(first.changed, true);
  assert.equal(second.changed, false);
  assert.equal(second.review.status, 'accepted');
});

test('dismissing a recommendation is idempotent', async () => {
  const repository = new InMemoryRecommendationReviewDecisionRepository();
  const recommendations = blockedTaskRecommendationsSnapshot();
  const recommendationId = recommendations.recommendations[0]?.id;
  assert.ok(recommendationId);

  const useCase = new RecordRecommendationReviewDecisionUseCase({
    recommendationService: createRecommendationService(recommendations),
    recommendationReviewUnitOfWork: createSilentReviewUnitOfWork(repository),
    clock: { now: () => REVIEWED_AT },
    eventIdGenerator: TEST_EVENT_ID_GENERATOR,
  });

  const first = await useCase.execute(REVIEW_MUTATION_CONTEXT, {
    recommendationId,
    decision: 'dismissed',
  });
  const second = await useCase.execute(REVIEW_MUTATION_CONTEXT, {
    recommendationId,
    decision: 'dismissed',
  });

  assert.equal(first.changed, true);
  assert.equal(second.changed, false);
  assert.equal(second.review.status, 'dismissed');
});

test('decision transitions overwrite the current review state', async () => {
  const repository = new InMemoryRecommendationReviewDecisionRepository();
  const recommendations = blockedTaskRecommendationsSnapshot();
  const recommendationId = recommendations.recommendations[0]?.id;
  assert.ok(recommendationId);

  const useCase = new RecordRecommendationReviewDecisionUseCase({
    recommendationService: createRecommendationService(recommendations),
    recommendationReviewUnitOfWork: createSilentReviewUnitOfWork(repository),
    clock: { now: () => REVIEWED_AT },
    eventIdGenerator: TEST_EVENT_ID_GENERATOR,
  });

  await useCase.execute(REVIEW_MUTATION_CONTEXT, { recommendationId, decision: 'dismissed' });
  const accepted = await useCase.execute(REVIEW_MUTATION_CONTEXT, {
    recommendationId,
    decision: 'accepted',
  });

  assert.equal(accepted.review.status, 'accepted');
  assert.equal(accepted.changed, true);
});

test('a new recommendation ID remains pending even when an older decision exists', async () => {
  const oldRecommendations = blockedTaskRecommendationsSnapshot();
  const oldRecommendationId = oldRecommendations.recommendations[0]?.id;
  assert.ok(oldRecommendationId);

  const repository = new InMemoryRecommendationReviewDecisionRepository();
  repository.seed({
    id: 'decision-1',
    organizationId: ORGANIZATION_ID,
    recommendationId: oldRecommendationId,
    decision: 'accepted',
    reviewedByUserId: USER_ID,
    reviewedAt: REVIEWED_AT,
  });

  const newRecommendations = generateRecommendationsFromDailyBriefingSnapshot(
    dailyBriefingSnapshotFixture({
      attentionItems: [
        {
          type: 'overdue_milestone',
          severity: 'high',
          entity: { entityType: 'Milestone', entityId: 'milestone-overdue' },
          title: 'Protocol Draft',
          reason: 'Milestone is overdue.',
          projectId: 'project-1',
        },
      ],
      evidence: [
        {
          evidenceType: 'operationalEntity',
          reference: {
            organizationId: ORGANIZATION_ID,
            entityType: 'Milestone',
            entityId: 'milestone-overdue',
          },
          source: 'missionControl',
        },
        {
          evidenceType: 'operationalEntity',
          reference: {
            organizationId: ORGANIZATION_ID,
            entityType: 'Project',
            entityId: 'project-1',
          },
          source: 'missionControl',
        },
      ],
    }),
  );

  const snapshot = await new GetRecommendationReviewSnapshotUseCase({
    recommendationService: createRecommendationService(newRecommendations),
    recommendationReviewDecisions: repository,
  }).execute(READ_CONTEXT);

  assert.notEqual(newRecommendations.recommendations[0]?.id, oldRecommendationId);
  assert.equal(snapshot.items[0]?.review.status, 'pending');
});

test('stale decisions do not create phantom recommendations in the review queue', async () => {
  const repository = new InMemoryRecommendationReviewDecisionRepository();
  repository.seed({
    id: 'decision-stale',
    organizationId: ORGANIZATION_ID,
    recommendationId: 'rec:stale:entity:Task:missing-task',
    decision: 'accepted',
    reviewedByUserId: USER_ID,
    reviewedAt: REVIEWED_AT,
  });

  const snapshot = await new GetRecommendationReviewSnapshotUseCase({
    recommendationService: createRecommendationService(
      generateRecommendationsFromDailyBriefingSnapshot(dailyBriefingSnapshotFixture()),
    ),
    recommendationReviewDecisions: repository,
  }).execute(READ_CONTEXT);

  assert.equal(snapshot.items.length, 0);
  assert.equal(snapshot.summary.total, 0);
});

test('review snapshot access is denied without dashboard read permission', async () => {
  await assert.rejects(
    () =>
      new GetRecommendationReviewSnapshotUseCase({
        recommendationService: createRecommendationService(),
        recommendationReviewDecisions: new InMemoryRecommendationReviewDecisionRepository(),
        accessPolicy: { canReadRecommendationReview: () => false, canReviewRecommendations: () => false },
      }).execute(READ_CONTEXT),
    (error: unknown) => error instanceof AuthorizationDeniedError,
  );
});

test('review mutations are denied without AI review permission', async () => {
  const recommendations = blockedTaskRecommendationsSnapshot();
  const recommendationId = recommendations.recommendations[0]?.id;
  assert.ok(recommendationId);

  await assert.rejects(
    () =>
      new RecordRecommendationReviewDecisionUseCase({
        recommendationService: createRecommendationService(recommendations),
        recommendationReviewUnitOfWork: createSilentReviewUnitOfWork(
          new InMemoryRecommendationReviewDecisionRepository(),
        ),
        clock: { now: () => REVIEWED_AT },
        eventIdGenerator: TEST_EVENT_ID_GENERATOR,
        accessPolicy: { canReadRecommendationReview: () => true, canReviewRecommendations: () => false },
      }).execute(REVIEW_MUTATION_CONTEXT, { recommendationId, decision: 'accepted' }),
    (error: unknown) => error instanceof AuthorizationDeniedError,
  );
});

test('member can read recommendation review snapshots with dashboard read access', async () => {
  const snapshot = await new GetRecommendationReviewSnapshotUseCase({
    recommendationService: createRecommendationService(),
    recommendationReviewDecisions: new InMemoryRecommendationReviewDecisionRepository(),
  }).execute(READ_CONTEXT);

  assert.equal(snapshot.items.length, 1);
});

test('viewer can read recommendation review snapshots with dashboard read access', async () => {
  const snapshot = await new GetRecommendationReviewSnapshotUseCase({
    recommendationService: createRecommendationService(),
    recommendationReviewDecisions: new InMemoryRecommendationReviewDecisionRepository(),
  }).execute({ organizationId: ORGANIZATION_ID, role: 'VIEWER' });

  assert.equal(snapshot.items.length, 1);
});

test('member cannot mutate recommendation review state without AI review permission', async () => {
  const recommendations = blockedTaskRecommendationsSnapshot();
  const recommendationId = recommendations.recommendations[0]?.id;
  assert.ok(recommendationId);

  await assert.rejects(
    () =>
      new RecordRecommendationReviewDecisionUseCase({
        recommendationService: createRecommendationService(recommendations),
        recommendationReviewUnitOfWork: createSilentReviewUnitOfWork(
          new InMemoryRecommendationReviewDecisionRepository(),
        ),
        clock: { now: () => REVIEWED_AT },
        eventIdGenerator: TEST_EVENT_ID_GENERATOR,
      }).execute(
        {
          ...REVIEW_MUTATION_CONTEXT,
          role: 'MEMBER',
        },
        { recommendationId, decision: 'accepted' },
      ),
    (error: unknown) => error instanceof AuthorizationDeniedError,
  );
});

test('admin can mutate recommendation review state with AI review permission', async () => {
  const repository = new InMemoryRecommendationReviewDecisionRepository();
  const recommendations = blockedTaskRecommendationsSnapshot();
  const recommendationId = recommendations.recommendations[0]?.id;
  assert.ok(recommendationId);

  const result = await new RecordRecommendationReviewDecisionUseCase({
    recommendationService: createRecommendationService(recommendations),
    recommendationReviewUnitOfWork: createSilentReviewUnitOfWork(repository),
    clock: { now: () => REVIEWED_AT },
    eventIdGenerator: TEST_EVENT_ID_GENERATOR,
  }).execute(REVIEW_MUTATION_CONTEXT, { recommendationId, decision: 'accepted' });

  assert.equal(result.review.status, 'accepted');
});

test('owner can mutate recommendation review state with AI review permission', async () => {
  const repository = new InMemoryRecommendationReviewDecisionRepository();
  const recommendations = blockedTaskRecommendationsSnapshot();
  const recommendationId = recommendations.recommendations[0]?.id;
  assert.ok(recommendationId);

  const result = await new RecordRecommendationReviewDecisionUseCase({
    recommendationService: createRecommendationService(recommendations),
    recommendationReviewUnitOfWork: createSilentReviewUnitOfWork(repository),
    clock: { now: () => REVIEWED_AT },
    eventIdGenerator: TEST_EVENT_ID_GENERATOR,
  }).execute(
    {
      ...REVIEW_MUTATION_CONTEXT,
      role: 'OWNER',
    },
    { recommendationId, decision: 'accepted' },
  );

  assert.equal(result.review.status, 'accepted');
});

test('recommendation facts remain sourced from generation, not persistence', async () => {
  const recommendations = blockedTaskRecommendationsSnapshot();
  const recommendationId = recommendations.recommendations[0]?.id;
  assert.ok(recommendationId);

  const repository = new InMemoryRecommendationReviewDecisionRepository();
  repository.seed({
    id: 'decision-1',
    organizationId: ORGANIZATION_ID,
    recommendationId,
    decision: 'accepted',
    reviewedByUserId: USER_ID,
    reviewedAt: REVIEWED_AT,
  });

  const snapshot = await new GetRecommendationReviewSnapshotUseCase({
    recommendationService: createRecommendationService(recommendations),
    recommendationReviewDecisions: repository,
  }).execute(READ_CONTEXT);

  assert.equal(snapshot.items[0]?.recommendation.title, 'Review blocker on Assay transfer');
  assert.equal(snapshot.items[0]?.recommendation.rationale.includes('Assay transfer'), true);
});

test('restricted recommendation metadata is preserved on the review snapshot', async () => {
  const recommendations = generateRecommendationsFromDailyBriefingSnapshot(
    dailyBriefingSnapshotFixture({
      metadata: {
        deterministic: true,
        restrictedSlices: ['tasks'],
        missionControlGeneratedAt: new Date('2026-07-26T12:00:00.000Z'),
      },
    }),
  );

  const snapshot = await new GetRecommendationReviewSnapshotUseCase({
    recommendationService: createRecommendationService(recommendations),
    recommendationReviewDecisions: new InMemoryRecommendationReviewDecisionRepository(),
  }).execute(READ_CONTEXT);

  assert.deepEqual(snapshot.metadata.restrictedSlices, ['tasks']);
});

test('RecommendationReviewService delegates read and mutation use cases', async () => {
  const repository = new InMemoryRecommendationReviewDecisionRepository();
  const recommendations = blockedTaskRecommendationsSnapshot();
  const recommendationId = recommendations.recommendations[0]?.id;
  assert.ok(recommendationId);

  const service = new RecommendationReviewService(
    new GetRecommendationReviewSnapshotUseCase({
      recommendationService: createRecommendationService(recommendations),
      recommendationReviewDecisions: repository,
    }),
    new RecordRecommendationReviewDecisionUseCase({
      recommendationService: createRecommendationService(recommendations),
      recommendationReviewUnitOfWork: createSilentReviewUnitOfWork(repository),
      clock: { now: () => REVIEWED_AT },
      eventIdGenerator: TEST_EVENT_ID_GENERATOR,
    }),
  );

  const snapshot = await service.getReviewSnapshot(READ_CONTEXT);
  assert.equal(snapshot.summary.pending, 1);

  const accepted = await service.acceptRecommendation(REVIEW_MUTATION_CONTEXT, { recommendationId });
  assert.equal(accepted.review.status, 'accepted');
});

test('join helper summary counts pending, accepted, and dismissed recommendations', () => {
  const recommendations = blockedTaskRecommendationsSnapshot().recommendations;
  const recommendationId = recommendations[0]?.id;
  assert.ok(recommendationId);

  const items = joinRecommendationsWithReviewDecisions(recommendations, [
    {
      id: 'decision-1',
      organizationId: ORGANIZATION_ID,
      recommendationId,
      decision: 'accepted',
      reviewedByUserId: USER_ID,
      reviewedAt: REVIEWED_AT,
    },
  ]);

  const summary = summarizeRecommendationReviewItems(items);
  assert.deepEqual(summary, { pending: 0, accepted: 1, dismissed: 0, total: 1 });
});

test('accept and dismiss record audit and domain events without executing actions', async () => {
  const repository = new InMemoryRecommendationReviewDecisionRepository();
  const recommendations = blockedTaskRecommendationsSnapshot();
  const recommendationId = recommendations.recommendations[0]?.id;
  assert.ok(recommendationId);
  const auditCalls: unknown[] = [];
  const eventCalls: unknown[] = [];

  const useCase = new RecordRecommendationReviewDecisionUseCase({
    recommendationService: createRecommendationService(recommendations),
    recommendationReviewUnitOfWork: createAuditEventsUnitOfWork(
      repository,
      auditCalls,
      eventCalls,
    ),
    clock: { now: () => REVIEWED_AT },
    eventIdGenerator: TEST_EVENT_ID_GENERATOR,
  });

  await useCase.execute(REVIEW_MUTATION_CONTEXT, { recommendationId, decision: 'accepted' });

  assert.equal(auditCalls.length, 1);
  assert.equal(eventCalls.length, 1);
  assert.equal((auditCalls[0] as { action: string }).action, 'APPROVE');
  assert.equal((eventCalls[0] as { eventType: string }).eventType, 'recommendation.review.accepted');
});