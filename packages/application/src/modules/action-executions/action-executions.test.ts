import assert from 'node:assert/strict';
import test from 'node:test';

import { identifier, organizationId, taskId, userId } from '@synaptria/core';
import { AuthorizationDeniedError } from '@synaptria/core/errors';
import type {
  ActionExecutionRequest,
  ActionExecutionRequestRepository,
  ConfirmActionExecutionRequestInput as ConfirmRepoInput,
  CreateActionExecutionRequestInput as CreateRepoInput,
} from '@synaptria/domain/action-executions';
import type { RecommendationReviewDecisionRepository } from '@synaptria/domain/recommendation-reviews';
import { PERMISSIONS, hasPermission } from '@synaptria/permissions';

import { dailyBriefingSnapshotFixture } from '../daily-briefing/narrative/testing/fixtures';
import { generateRecommendationsFromDailyBriefingSnapshot } from '../recommendations/generate-recommendations';
import type { RecommendationSnapshotReader } from '../action-proposals/recommendation-snapshot-reader';
import type {
  ActionProposalStateReaders,
  TaskActionProposalState,
  TaskActionProposalStateReader,
} from '../action-proposals/state-readers/types';
import { ConfirmActionExecutionRequestUseCase } from './confirm-action-execution-request';
import { CreateActionExecutionRequestUseCase } from './create-action-execution-request';
import { DefaultOperationalActionProposalReader } from './default-operational-action-proposal-reader';
import type { ActionExecutionUnitOfWork } from './action-execution-unit-of-work';

const ORGANIZATION_ID = organizationId('org-1');
const OTHER_ORGANIZATION_ID = organizationId('org-2');
const USER_ID = userId('user-1');
const MEMBERSHIP_ID = identifier('membership-1', 'MembershipId');
const REQUEST_ID = identifier('request-1', 'RequestId');
const CORRELATION_ID = identifier('correlation-1', 'CorrelationId');
const NOW = new Date('2026-07-26T15:00:00.000Z');

const ADMIN_CONTEXT = {
  organizationId: ORGANIZATION_ID,
  userId: USER_ID,
  membershipId: MEMBERSHIP_ID,
  role: 'ADMIN' as const,
  requestId: REQUEST_ID,
  correlationId: CORRELATION_ID,
};

const MEMBER_CONTEXT = {
  ...ADMIN_CONTEXT,
  role: 'MEMBER' as const,
};

class InMemoryActionExecutionRequestRepository implements ActionExecutionRequestRepository {
  private readonly records = new Map<string, ActionExecutionRequest>();
  private nextId = 1;

  async create(input: CreateRepoInput): Promise<ActionExecutionRequest> {
    const record: ActionExecutionRequest = {
      id: `exec-req-${this.nextId++}`,
      organizationId: input.organizationId,
      snapshot: input.snapshot,
      snapshotFingerprint: input.snapshotFingerprint,
      requestedByUserId: input.requestedByUserId,
      requestedAt: input.requestedAt,
      status: 'PENDING_CONFIRMATION',
      createIdempotencyKey: input.createIdempotencyKey,
    };
    this.records.set(record.id, record);
    return record;
  }

  async findById(
    organizationId: string,
    requestId: string,
  ): Promise<ActionExecutionRequest | null> {
    const record = this.records.get(requestId);
    if (record === undefined || record.organizationId !== organizationId) {
      return null;
    }
    return record;
  }

  async findByCreateIdempotencyKey(
    organizationId: string,
    createIdempotencyKey: string,
  ): Promise<ActionExecutionRequest | null> {
    return (
      [...this.records.values()].find(
        (record) =>
          record.organizationId === organizationId &&
          record.createIdempotencyKey === createIdempotencyKey,
      ) ?? null
    );
  }

  async findBySnapshotFingerprint(
    organizationId: string,
    snapshotFingerprint: string,
  ): Promise<ActionExecutionRequest | null> {
    return (
      [...this.records.values()].find(
        (record) =>
          record.organizationId === organizationId &&
          record.snapshotFingerprint === snapshotFingerprint,
      ) ?? null
    );
  }

  async confirm(input: ConfirmRepoInput): Promise<ActionExecutionRequest> {
    const current = await this.findById(input.organizationId, input.requestId);
    if (current === null) {
      throw new Error('Execution request not found.');
    }

    const confirmed: ActionExecutionRequest = {
      ...current,
      status: 'CONFIRMED',
      confirmedByUserId: input.confirmedByUserId,
      confirmedAt: input.confirmedAt,
      ...(input.confirmIdempotencyKey === undefined
        ? {}
        : { confirmIdempotencyKey: input.confirmIdempotencyKey }),
    };
    this.records.set(current.id, confirmed);
    return confirmed;
  }
}

class InMemoryRecommendationReviewDecisionRepository
  implements RecommendationReviewDecisionRepository
{
  private readonly records = new Map<string, { recommendationId: string; decision: string }>();

  seed(recommendationId: string, decision: 'accepted' | 'dismissed'): void {
    this.records.set(`${ORGANIZATION_ID}:${recommendationId}`, { recommendationId, decision });
  }

  async upsert(): Promise<never> {
    throw new Error('Not implemented in test.');
  }

  async findByRecommendationIds(
    organizationId: string,
    recommendationIds: readonly string[],
  ) {
    return recommendationIds
      .map((recommendationId) => this.records.get(`${organizationId}:${recommendationId}`))
      .filter((record) => record !== undefined)
      .map((record) => ({
        id: `decision-${record!.recommendationId}`,
        organizationId: ORGANIZATION_ID,
        recommendationId: record!.recommendationId,
        decision: record!.decision as 'accepted' | 'dismissed',
        reviewedByUserId: USER_ID,
        reviewedAt: NOW,
      }));
  }
}

class InMemoryTaskActionProposalStateReader implements TaskActionProposalStateReader {
  constructor(private state: TaskActionProposalState | null) {}

  setState(state: TaskActionProposalState | null): void {
    this.state = state;
  }

  async findById(
    organizationId: Parameters<TaskActionProposalStateReader['findById']>[0],
    id: Parameters<TaskActionProposalStateReader['findById']>[1],
  ): Promise<TaskActionProposalState | null> {
    if (this.state === null) {
      return null;
    }

    if (this.state.organizationId !== organizationId || this.state.taskId !== id) {
      return null;
    }

    return this.state;
  }
}

function operationalPriorityRecommendations() {
  return generateRecommendationsFromDailyBriefingSnapshot(
    dailyBriefingSnapshotFixture({
      attentionItems: [],
      taskSignals: [
        {
          taskId: 'task-blocked-overdue',
          taskName: 'Assay transfer',
          milestoneId: 'milestone-1',
          milestoneName: 'Protocol Draft',
          projectId: 'project-1',
          projectName: 'Alpha Study',
          status: 'BLOCKED',
          priority: 'MEDIUM',
          plannedEndDate: '2026-07-20T12:00:00.000Z',
          overdue: true,
          dueSoon: false,
          blocked: true,
        },
      ],
      projectHighlights: [
        {
          projectId: 'project-1',
          projectName: 'Alpha Study',
          healthState: 'at_risk',
          attentionSeverity: 'high',
          overdueTasks: 1,
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
            entityId: 'task-blocked-overdue',
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

function createHarness(options?: {
  accepted?: boolean;
  dismissed?: boolean;
  taskPriority?: string;
  taskUpdatedAt?: string;
}) {
  const recommendationsSnapshot = operationalPriorityRecommendations();
  const operationalRecommendation = recommendationsSnapshot.recommendations.find(
    (item) => item.type === 'escalate_blocked_overdue_task_priority',
  );
  assert.ok(operationalRecommendation);

  const reviewRepository = new InMemoryRecommendationReviewDecisionRepository();
  if (options?.accepted === true) {
    reviewRepository.seed(operationalRecommendation.id, 'accepted');
  }
  if (options?.dismissed === true) {
    reviewRepository.seed(operationalRecommendation.id, 'dismissed');
  }

  const recommendationSnapshotReader: RecommendationSnapshotReader = {
    getRecommendations: async () => recommendationsSnapshot,
  };

  const taskState: TaskActionProposalState = {
    taskId: taskId('task-blocked-overdue'),
    organizationId: ORGANIZATION_ID,
    status: 'BLOCKED',
    priority: (options?.taskPriority ?? 'MEDIUM') as TaskActionProposalState['priority'],
    plannedEndDate: null,
    updatedAt: options?.taskUpdatedAt ?? '2026-07-26T12:00:00.000Z',
  };

  const taskReader = new InMemoryTaskActionProposalStateReader(taskState);
  const stateReaders: ActionProposalStateReaders = {
    tasks: taskReader,
    milestones: { findById: async () => null },
    projects: { findById: async () => null },
  };

  const executionRepository = new InMemoryActionExecutionRequestRepository();
  const auditEvents: unknown[] = [];
  const domainEvents: unknown[] = [];

  const unitOfWork: ActionExecutionUnitOfWork = {
    execute: async (operation) =>
      operation({
        actionExecutionRequests: executionRepository,
        audit: {
          create: async (input) => {
            auditEvents.push(input);
            return { id: `audit-${auditEvents.length}`, ...input } as never;
          },
        },
        events: {
          append: async (input) => {
            domainEvents.push(input);
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

  const operationalReader = new DefaultOperationalActionProposalReader({
    recommendationSnapshotReader,
    recommendationReviewDecisionReader: reviewRepository,
    stateReaders,
  });

  const createUseCase = new CreateActionExecutionRequestUseCase({
    operationalActionProposalReader: operationalReader,
    actionExecutionUnitOfWork: unitOfWork,
    clock: { now: () => NOW },
    eventIdGenerator: { generate: () => 'event-1' },
  });

  const confirmUseCase = new ConfirmActionExecutionRequestUseCase({
    actionExecutionRequestRepository: executionRepository,
    actionExecutionUnitOfWork: unitOfWork,
    stateReaders,
    clock: { now: () => NOW },
    eventIdGenerator: { generate: () => 'event-2' },
  });

  return {
    operationalRecommendation,
    createUseCase,
    confirmUseCase,
    executionRepository,
    taskReader,
    auditEvents,
    domainEvents,
  };
}

test('ACTIONS_CONFIRM permission is limited to owner and admin roles', () => {
  assert.equal(hasPermission('OWNER', PERMISSIONS.ACTIONS_CONFIRM), true);
  assert.equal(hasPermission('ADMIN', PERMISSIONS.ACTIONS_CONFIRM), true);
  assert.equal(hasPermission('MEMBER', PERMISSIONS.ACTIONS_CONFIRM), false);
  assert.equal(hasPermission('VIEWER', PERMISSIONS.ACTIONS_CONFIRM), false);
  assert.equal(hasPermission('MEMBER', PERMISSIONS.AI_REVIEW), false);
});

test('accepted operational proposal creates pending execution request with immutable snapshot', async () => {
  const { operationalRecommendation, createUseCase } = createHarness({ accepted: true });

  const result = await createUseCase.execute(ADMIN_CONTEXT, {
    recommendationId: operationalRecommendation.id,
    createIdempotencyKey: 'create-key-1',
  });

  assert.equal(result.changed, true);
  assert.equal(result.request.status, 'PENDING_CONFIRMATION');
  assert.deepEqual(result.request.snapshot.proposedChanges, [
    { field: 'priority', currentValue: 'MEDIUM', proposedValue: 'HIGH' },
  ]);
  assert.deepEqual(result.request.snapshot.preconditions, [
    { field: 'priority', expectedValue: 'MEDIUM' },
    { field: 'updatedAt', expectedValue: '2026-07-26T12:00:00.000Z' },
  ]);
  assert.equal(result.request.snapshot.actionType, 'ESCALATE_BLOCKED_OVERDUE_TASK_PRIORITY');
});

test('pending or dismissed recommendation review rejects execution request creation', async () => {
  const { operationalRecommendation, createUseCase } = createHarness();

  await assert.rejects(
    () =>
      createUseCase.execute(ADMIN_CONTEXT, {
        recommendationId: operationalRecommendation.id,
        createIdempotencyKey: 'create-key-1',
      }),
    /accepted recommendation/i,
  );

  const dismissedHarness = createHarness({ dismissed: true });
  await assert.rejects(
    () =>
      dismissedHarness.createUseCase.execute(ADMIN_CONTEXT, {
        recommendationId: dismissedHarness.operationalRecommendation.id,
        createIdempotencyKey: 'create-key-1',
      }),
    /accepted recommendation/i,
  );
});

test('advisory-only accepted recommendation cannot create execution request', async () => {
  const recommendationsSnapshot = generateRecommendationsFromDailyBriefingSnapshot(
    dailyBriefingSnapshotFixture({
      attentionItems: [
        {
          type: 'blocked_task',
          severity: 'critical',
          entity: { entityType: 'Task', entityId: 'task-blocked' },
          title: 'Assay transfer',
          reason: 'Task is blocked.',
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

  const advisoryRecommendation = recommendationsSnapshot.recommendations.find(
    (item) => item.type === 'resolve_blocked_critical_task',
  );
  assert.ok(advisoryRecommendation);

  const reviewRepository = new InMemoryRecommendationReviewDecisionRepository();
  reviewRepository.seed(advisoryRecommendation.id, 'accepted');

  const createUseCase = new CreateActionExecutionRequestUseCase({
    operationalActionProposalReader: new DefaultOperationalActionProposalReader({
      recommendationSnapshotReader: {
        getRecommendations: async () => recommendationsSnapshot,
      },
      recommendationReviewDecisionReader: reviewRepository,
      stateReaders: {
        tasks: new InMemoryTaskActionProposalStateReader({
          taskId: taskId('task-blocked'),
          organizationId: ORGANIZATION_ID,
          status: 'BLOCKED',
          priority: 'HIGH',
          plannedEndDate: null,
          updatedAt: '2026-07-26T12:00:00.000Z',
        }),
        milestones: { findById: async () => null },
        projects: { findById: async () => null },
      },
    }),
    actionExecutionUnitOfWork: {
      execute: async () => {
        throw new Error('Should not persist advisory execution request.');
      },
    },
    clock: { now: () => NOW },
    eventIdGenerator: { generate: () => 'event-1' },
  });

  await assert.rejects(
    () =>
      createUseCase.execute(ADMIN_CONTEXT, {
        recommendationId: advisoryRecommendation.id,
        createIdempotencyKey: 'create-key-advisory',
      }),
    /accepted recommendation|operational/i,
  );
});

test('stale operational proposal rejects execution request creation', async () => {
  const { operationalRecommendation } = createHarness({ accepted: true });

  const staleReader = {
    loadOperationalProposal: async () => ({
      proposal: {
        id: `ap:${operationalRecommendation.id}`,
        organizationId: ORGANIZATION_ID,
        recommendationId: operationalRecommendation.id,
        recommendationType: operationalRecommendation.type,
        actionType: 'ESCALATE_BLOCKED_OVERDUE_TASK_PRIORITY',
        proposalKind: 'OPERATIONAL' as const,
        target: { entityType: 'Task' as const, entityId: 'task-blocked-overdue' },
        title: 'Operational change',
        description: 'Escalate priority',
        proposedChanges: [
          { field: 'priority', currentValue: 'MEDIUM', proposedValue: 'HIGH' },
        ],
        preconditions: [
          { field: 'priority', expectedValue: 'MEDIUM' },
          { field: 'updatedAt', expectedValue: '2026-07-26T12:00:00.000Z' },
        ],
        evidenceKeys: [],
        status: 'PROPOSED' as const,
        createdAt: NOW,
      },
      validation: {
        status: 'STALE' as const,
        issues: ['Field "priority" no longer matches the expected precondition value.'],
      },
    }),
  };

  const createUseCase = new CreateActionExecutionRequestUseCase({
    operationalActionProposalReader: staleReader,
    actionExecutionUnitOfWork: {
      execute: async () => {
        throw new Error('Should not persist stale execution request.');
      },
    },
    clock: { now: () => NOW },
    eventIdGenerator: { generate: () => 'event-stale' },
  });

  await assert.rejects(
    () =>
      createUseCase.execute(ADMIN_CONTEXT, {
        recommendationId: operationalRecommendation.id,
        createIdempotencyKey: 'create-key-stale',
      }),
    /stale/i,
  );
});

test('accepted recommendation alone leaves execution request pending until explicit confirmation', async () => {
  const { operationalRecommendation, createUseCase, confirmUseCase } = createHarness({
    accepted: true,
  });

  const created = await createUseCase.execute(ADMIN_CONTEXT, {
    recommendationId: operationalRecommendation.id,
    createIdempotencyKey: 'create-key-confirm',
  });

  assert.equal(created.request.status, 'PENDING_CONFIRMATION');
  assert.equal(created.request.confirmedAt, undefined);

  const confirmed = await confirmUseCase.execute(ADMIN_CONTEXT, {
    executionRequestId: created.request.id,
    confirmIdempotencyKey: 'confirm-key-1',
  });

  assert.equal(confirmed.changed, true);
  assert.equal(confirmed.request.status, 'CONFIRMED');
  assert.equal(confirmed.request.confirmedByUserId, USER_ID);
});

test('confirmation revalidates preconditions and rejects stale drift', async () => {
  const harness = createHarness({ accepted: true });
  const created = await harness.createUseCase.execute(ADMIN_CONTEXT, {
    recommendationId: harness.operationalRecommendation.id,
    createIdempotencyKey: 'create-key-drift',
  });

  harness.taskReader.setState({
    taskId: taskId('task-blocked-overdue'),
    organizationId: ORGANIZATION_ID,
    status: 'BLOCKED',
    priority: 'HIGH',
    plannedEndDate: null,
    updatedAt: '2026-07-26T12:00:00.000Z',
  });

  await assert.rejects(
    () =>
      harness.confirmUseCase.execute(ADMIN_CONTEXT, {
        executionRequestId: created.request.id,
      }),
    /stale/i,
  );
});

test('create and confirm idempotency keys deduplicate logical authorizations', async () => {
  const { operationalRecommendation, createUseCase, confirmUseCase } = createHarness({
    accepted: true,
  });

  const first = await createUseCase.execute(ADMIN_CONTEXT, {
    recommendationId: operationalRecommendation.id,
    createIdempotencyKey: 'create-key-idempotent',
  });
  const second = await createUseCase.execute(ADMIN_CONTEXT, {
    recommendationId: operationalRecommendation.id,
    createIdempotencyKey: 'create-key-idempotent',
  });

  assert.equal(first.changed, true);
  assert.equal(second.changed, false);
  assert.equal(first.request.id, second.request.id);

  const confirmedFirst = await confirmUseCase.execute(ADMIN_CONTEXT, {
    executionRequestId: first.request.id,
    confirmIdempotencyKey: 'confirm-key-idempotent',
  });
  const confirmedSecond = await confirmUseCase.execute(ADMIN_CONTEXT, {
    executionRequestId: first.request.id,
    confirmIdempotencyKey: 'confirm-key-idempotent',
  });

  assert.equal(confirmedFirst.changed, true);
  assert.equal(confirmedSecond.changed, false);
  assert.equal(confirmedFirst.request.status, 'CONFIRMED');
});

test('member and viewer cannot create or confirm execution requests', async () => {
  const { operationalRecommendation, createUseCase, confirmUseCase } = createHarness({
    accepted: true,
  });

  await assert.rejects(
    () =>
      createUseCase.execute(MEMBER_CONTEXT, {
        recommendationId: operationalRecommendation.id,
        createIdempotencyKey: 'create-key-member',
      }),
    AuthorizationDeniedError,
  );

  const created = await createUseCase.execute(ADMIN_CONTEXT, {
    recommendationId: operationalRecommendation.id,
    createIdempotencyKey: 'create-key-admin',
  });

  await assert.rejects(
    () =>
      confirmUseCase.execute(MEMBER_CONTEXT, {
        executionRequestId: created.request.id,
      }),
    AuthorizationDeniedError,
  );
});

test('requested and confirmed events are emitted without executed events', async () => {
  const { operationalRecommendation, createUseCase, confirmUseCase, domainEvents } =
    createHarness({ accepted: true });

  const created = await createUseCase.execute(ADMIN_CONTEXT, {
    recommendationId: operationalRecommendation.id,
    createIdempotencyKey: 'create-key-events',
  });

  await confirmUseCase.execute(ADMIN_CONTEXT, {
    executionRequestId: created.request.id,
  });

  const eventTypes = domainEvents.map((event) => (event as { eventType: string }).eventType);
  assert.deepEqual(eventTypes, ['action.execution.requested', 'action.execution.confirmed']);
  assert.ok(!eventTypes.some((type) => type.includes('executed')));
});

test('immutable snapshot preserves captured values after task state changes', async () => {
  const harness = createHarness({ accepted: true });
  const created = await harness.createUseCase.execute(ADMIN_CONTEXT, {
    recommendationId: harness.operationalRecommendation.id,
    createIdempotencyKey: 'create-key-immutable',
  });

  harness.taskReader.setState({
    taskId: taskId('task-blocked-overdue'),
    organizationId: ORGANIZATION_ID,
    status: 'BLOCKED',
    priority: 'LOW',
    plannedEndDate: null,
    updatedAt: '2026-07-26T13:00:00.000Z',
  });

  const stored = await harness.executionRepository.findById(
    ORGANIZATION_ID,
    created.request.id,
  );
  assert.ok(stored);
  assert.deepEqual(stored.snapshot.preconditions, [
    { field: 'priority', expectedValue: 'MEDIUM' },
    { field: 'updatedAt', expectedValue: '2026-07-26T12:00:00.000Z' },
  ]);
});

test('identical immutable snapshot returns the same logical execution request', async () => {
  const { operationalRecommendation, createUseCase } = createHarness({ accepted: true });

  const first = await createUseCase.execute(ADMIN_CONTEXT, {
    recommendationId: operationalRecommendation.id,
    createIdempotencyKey: 'create-key-a',
  });
  const second = await createUseCase.execute(ADMIN_CONTEXT, {
    recommendationId: operationalRecommendation.id,
    createIdempotencyKey: 'create-key-b',
  });

  assert.equal(first.changed, true);
  assert.equal(second.changed, false);
  assert.equal(first.request.snapshotFingerprint, second.request.snapshotFingerprint);
  assert.equal(first.request.id, second.request.id);
});

test('same actionProposalId with changed current priority allows a new execution request', async () => {
  const harness = createHarness({ accepted: true, taskPriority: 'MEDIUM' });
  const first = await harness.createUseCase.execute(ADMIN_CONTEXT, {
    recommendationId: harness.operationalRecommendation.id,
    createIdempotencyKey: 'create-key-medium',
  });

  harness.taskReader.setState({
    taskId: taskId('task-blocked-overdue'),
    organizationId: ORGANIZATION_ID,
    status: 'BLOCKED',
    priority: 'LOW',
    plannedEndDate: null,
    updatedAt: '2026-07-26T12:00:00.000Z',
  });

  const second = await harness.createUseCase.execute(ADMIN_CONTEXT, {
    recommendationId: harness.operationalRecommendation.id,
    createIdempotencyKey: 'create-key-low',
  });

  assert.notEqual(first.request.snapshotFingerprint, second.request.snapshotFingerprint);
  assert.notEqual(first.request.id, second.request.id);
  assert.equal(second.changed, true);
  assert.equal(first.request.snapshot.actionProposalId, second.request.snapshot.actionProposalId);
});

test('same actionProposalId with changed updatedAt precondition allows a new execution request', async () => {
  const harness = createHarness({
    accepted: true,
    taskPriority: 'MEDIUM',
    taskUpdatedAt: '2026-07-26T12:00:00.000Z',
  });
  const first = await harness.createUseCase.execute(ADMIN_CONTEXT, {
    recommendationId: harness.operationalRecommendation.id,
    createIdempotencyKey: 'create-key-t1',
  });

  harness.taskReader.setState({
    taskId: taskId('task-blocked-overdue'),
    organizationId: ORGANIZATION_ID,
    status: 'BLOCKED',
    priority: 'MEDIUM',
    plannedEndDate: null,
    updatedAt: '2026-07-26T13:00:00.000Z',
  });

  const second = await harness.createUseCase.execute(ADMIN_CONTEXT, {
    recommendationId: harness.operationalRecommendation.id,
    createIdempotencyKey: 'create-key-t2',
  });

  assert.notEqual(first.request.snapshotFingerprint, second.request.snapshotFingerprint);
  assert.notEqual(first.request.id, second.request.id);
});

test('old confirmed request does not authorize a newer snapshot', async () => {
  const harness = createHarness({ accepted: true, taskPriority: 'MEDIUM' });
  const first = await harness.createUseCase.execute(ADMIN_CONTEXT, {
    recommendationId: harness.operationalRecommendation.id,
    createIdempotencyKey: 'create-key-old-confirmed',
  });
  const confirmedFirst = await harness.confirmUseCase.execute(ADMIN_CONTEXT, {
    executionRequestId: first.request.id,
  });

  harness.taskReader.setState({
    taskId: taskId('task-blocked-overdue'),
    organizationId: ORGANIZATION_ID,
    status: 'BLOCKED',
    priority: 'LOW',
    plannedEndDate: null,
    updatedAt: '2026-07-26T12:00:00.000Z',
  });

  const second = await harness.createUseCase.execute(ADMIN_CONTEXT, {
    recommendationId: harness.operationalRecommendation.id,
    createIdempotencyKey: 'create-key-new-after-confirmed',
  });

  assert.equal(confirmedFirst.request.status, 'CONFIRMED');
  assert.equal(second.request.status, 'PENDING_CONFIRMATION');
  assert.notEqual(first.request.id, second.request.id);
});

test('old pending request does not block a newer snapshot request', async () => {
  const harness = createHarness({ accepted: true, taskPriority: 'MEDIUM' });
  const first = await harness.createUseCase.execute(ADMIN_CONTEXT, {
    recommendationId: harness.operationalRecommendation.id,
    createIdempotencyKey: 'create-key-old-pending',
  });

  harness.taskReader.setState({
    taskId: taskId('task-blocked-overdue'),
    organizationId: ORGANIZATION_ID,
    status: 'BLOCKED',
    priority: 'LOW',
    plannedEndDate: null,
    updatedAt: '2026-07-26T12:00:00.000Z',
  });

  const second = await harness.createUseCase.execute(ADMIN_CONTEXT, {
    recommendationId: harness.operationalRecommendation.id,
    createIdempotencyKey: 'create-key-new-after-pending',
  });

  assert.equal(first.request.status, 'PENDING_CONFIRMATION');
  assert.equal(second.changed, true);
  assert.notEqual(first.request.id, second.request.id);
});

test('reused create idempotency key for a different snapshot fails deterministically', async () => {
  const harness = createHarness({ accepted: true, taskPriority: 'MEDIUM' });
  await harness.createUseCase.execute(ADMIN_CONTEXT, {
    recommendationId: harness.operationalRecommendation.id,
    createIdempotencyKey: 'create-key-conflict',
  });

  harness.taskReader.setState({
    taskId: taskId('task-blocked-overdue'),
    organizationId: ORGANIZATION_ID,
    status: 'BLOCKED',
    priority: 'LOW',
    plannedEndDate: null,
    updatedAt: '2026-07-26T12:00:00.000Z',
  });

  await assert.rejects(
    () =>
      harness.createUseCase.execute(ADMIN_CONTEXT, {
        recommendationId: harness.operationalRecommendation.id,
        createIdempotencyKey: 'create-key-conflict',
      }),
    /different execution authorization snapshot/i,
  );
});
