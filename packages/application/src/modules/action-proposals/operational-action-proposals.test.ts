import assert from 'node:assert/strict';
import test from 'node:test';

import { organizationId, taskId } from '@synaptria/core';

import { dailyBriefingSnapshotFixture } from '../daily-briefing/narrative/testing/fixtures';
import { generateRecommendationsFromDailyBriefingSnapshot } from '../recommendations/generate-recommendations';
import {
  buildActionProposalFromAcceptedRecommendation,
  buildOperationalActionProposalForTests,
} from './build-action-proposal-from-recommendation';
import {
  evaluateOperationalMapping,
  isOperationalMappingEligible,
} from './evaluate-operational-mapping';
import {
  loadAuthoritativeCurrentState,
  resolveActionProposalValidationFromCurrentState,
} from './resolve-action-proposal-validation';
import type {
  ActionProposalStateReaders,
  TaskActionProposalState,
  TaskActionProposalStateReader,
} from './state-readers/types';

const ORGANIZATION_ID = organizationId('org-1');

function blockedTaskSnapshot() {
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

class InMemoryTaskActionProposalStateReader implements TaskActionProposalStateReader {
  constructor(private readonly states: ReadonlyMap<string, TaskActionProposalState>) {}

  async findById(
    organizationId: Parameters<TaskActionProposalStateReader['findById']>[0],
    id: Parameters<TaskActionProposalStateReader['findById']>[1],
  ): Promise<TaskActionProposalState | null> {
    return this.states.get(`${organizationId}:${id}`) ?? null;
  }
}

function createStateReaders(taskState?: TaskActionProposalState): ActionProposalStateReaders {
  const taskStates = new Map<string, TaskActionProposalState>();

  if (taskState !== undefined) {
    taskStates.set(`${ORGANIZATION_ID}:${taskState.taskId}`, taskState);
  }

  return {
    tasks: new InMemoryTaskActionProposalStateReader(taskStates),
    milestones: { findById: async () => null },
    projects: { findById: async () => null },
  };
}

const TASK_STATE: TaskActionProposalState = {
  taskId: taskId('task-blocked'),
  organizationId: ORGANIZATION_ID,
  status: 'BLOCKED',
  priority: 'HIGH',
  plannedEndDate: null,
  updatedAt: '2026-07-26T12:00:00.000Z',
};

test('current recommendation types are not eligible for operational mapping', () => {
  const recommendation = blockedTaskSnapshot().recommendations[0];
  assert.ok(recommendation);

  for (const type of [
    'resolve_blocked_critical_task',
    'escalate_overdue_milestone',
    'rebalance_near_term_workload',
    'review_concentrated_execution_risk',
  ] as const) {
    const evaluation = evaluateOperationalMapping({ ...recommendation, type });
    assert.equal(evaluation.eligible, false);
    assert.match(evaluation.reason, /deterministic field mutation|exact proposed value|review only/i);
  }

  assert.equal(isOperationalMappingEligible(recommendation), false);
});

test('accepted recommendation builder keeps live mappings advisory without fabrication', async () => {
  const recommendation = blockedTaskSnapshot().recommendations[0];
  assert.ok(recommendation);

  const built = await buildActionProposalFromAcceptedRecommendation(recommendation, {
    organizationId: ORGANIZATION_ID,
    stateReaders: createStateReaders(TASK_STATE),
  });

  assert.ok(built);
  assert.equal(built.mappingKind, 'ADVISORY');
  assert.equal(built.proposal.proposalKind, 'ADVISORY');
  assert.deepEqual(built.proposal.proposedChanges, []);
  assert.deepEqual(built.proposal.preconditions, []);
  assert.match(built.operationalMappingReason ?? '', /deterministic field mutation|exact proposed value/i);
});

test('operational builder uses explicit changes and rejects recommendation prose as authoritative state', () => {
  const recommendation = blockedTaskSnapshot().recommendations[0];
  assert.ok(recommendation);

  const proposal = buildOperationalActionProposalForTests(recommendation, {
    actionType: 'REQUEST_TASK_BLOCKER_REVIEW',
    title: 'Operational change: Unblock task',
    description: 'Set task status to IN_PROGRESS after blocker review.',
    proposedChanges: [
      { field: 'status', currentValue: 'BLOCKED', proposedValue: 'IN_PROGRESS' },
    ],
    preconditions: [
      { field: 'status', expectedValue: 'BLOCKED' },
      { field: 'updatedAt', expectedValue: '2026-07-26T12:00:00.000Z' },
    ],
  });

  assert.ok(proposal);
  assert.equal(proposal.proposalKind, 'OPERATIONAL');
  assert.notEqual(proposal.description, recommendation.proposedAction.description);
});

test('operational builder rejects updatedAt as a proposed change field', () => {
  const recommendation = blockedTaskSnapshot().recommendations[0];
  assert.ok(recommendation);

  const proposal = buildOperationalActionProposalForTests(recommendation, {
    actionType: 'REQUEST_TASK_BLOCKER_REVIEW',
    title: 'Operational change: Touch updatedAt',
    description: 'Attempt to mutate updatedAt directly.',
    proposedChanges: [
      {
        field: 'updatedAt',
        currentValue: '2026-07-26T12:00:00.000Z',
        proposedValue: '2026-07-26T13:00:00.000Z',
      },
    ],
    preconditions: [
      { field: 'updatedAt', expectedValue: '2026-07-26T12:00:00.000Z' },
    ],
  });

  assert.equal(proposal, null);
});

test('authoritative state reader is used for operational validation', async () => {
  const recommendation = blockedTaskSnapshot().recommendations[0];
  assert.ok(recommendation);

  const proposal = buildOperationalActionProposalForTests(recommendation, {
    actionType: 'REQUEST_TASK_BLOCKER_REVIEW',
    title: 'Operational change: Unblock task',
    description: 'Set task status to IN_PROGRESS after blocker review.',
    proposedChanges: [
      { field: 'status', currentValue: 'BLOCKED', proposedValue: 'IN_PROGRESS' },
    ],
    preconditions: [{ field: 'status', expectedValue: 'BLOCKED' }],
  });
  assert.ok(proposal);

  const currentState = await loadAuthoritativeCurrentState(
    proposal,
    ORGANIZATION_ID,
    createStateReaders(TASK_STATE),
  );

  assert.ok(currentState);
  assert.equal(currentState.status, 'BLOCKED');

  const missingTargetState = await loadAuthoritativeCurrentState(
    proposal,
    ORGANIZATION_ID,
    createStateReaders(),
  );
  assert.equal(missingTargetState, null);

  const currentValidation = resolveActionProposalValidationFromCurrentState(proposal, currentState);
  assert.deepEqual(currentValidation, { status: 'CURRENT', issues: [] });

  const staleValidation = resolveActionProposalValidationFromCurrentState(proposal, {
    ...currentState,
    status: 'IN_PROGRESS',
  });
  assert.equal(staleValidation.status, 'STALE');
});

test('advisory proposals remain not applicable for operational precondition validation', () => {
  const recommendation = blockedTaskSnapshot().recommendations[0];
  assert.ok(recommendation);

  const validation = resolveActionProposalValidationFromCurrentState(
    {
      id: 'ap:test',
      organizationId: ORGANIZATION_ID,
      recommendationId: recommendation.id,
      recommendationType: recommendation.type,
      actionType: 'REQUEST_TASK_BLOCKER_REVIEW',
      proposalKind: 'ADVISORY',
      target: { entityType: 'Task', entityId: 'task-blocked' },
      title: 'Advisory review',
      description: recommendation.proposedAction.description,
      proposedChanges: [],
      preconditions: [],
      evidenceKeys: ['entity:Task:task-blocked'],
      status: 'PROPOSED',
      createdAt: recommendation.generatedAt,
    },
    { status: 'BLOCKED' },
  );

  assert.deepEqual(validation, { status: 'NOT_APPLICABLE', issues: [] });
});
