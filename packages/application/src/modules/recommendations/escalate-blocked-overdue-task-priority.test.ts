import assert from 'node:assert/strict';
import test from 'node:test';

import { organizationId } from '@synaptria/core';

import { dailyBriefingSnapshotFixture } from '../daily-briefing/narrative/testing/fixtures';
import type { DailyBriefingTaskSignal } from '../daily-briefing/types';
import { generateRecommendationsFromDailyBriefingSnapshot } from './generate-recommendations';
import { buildRecommendationId } from './recommendation-id';
import { escalateBlockedOverdueTaskPriorityRule } from './rules/escalate-blocked-overdue-task-priority.rule';

const ORGANIZATION_ID = organizationId('org-1');

function qualifyingTaskSignal(
  overrides: Partial<DailyBriefingTaskSignal> = {},
): DailyBriefingTaskSignal {
  return {
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
    ...overrides,
  };
}

function operationalSnapshotFixture(
  overrides: Partial<ReturnType<typeof dailyBriefingSnapshotFixture>> = {},
) {
  return dailyBriefingSnapshotFixture({
    attentionItems: [],
    taskSignals: [qualifyingTaskSignal()],
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
    metadata: {
      deterministic: true,
      restrictedSlices: [],
      missionControlGeneratedAt: new Date('2026-07-26T12:00:00.000Z'),
    },
    ...overrides,
  });
}

test('qualifying blocked overdue task produces operational priority recommendation', () => {
  const snapshot = operationalSnapshotFixture();
  const result = generateRecommendationsFromDailyBriefingSnapshot(snapshot);
  const recommendation = result.recommendations.find(
    (item) => item.type === 'escalate_blocked_overdue_task_priority',
  );

  assert.ok(recommendation);
  assert.equal(recommendation.ruleId, 'recommendations.escalate-blocked-overdue-task-priority.v0');
  assert.deepEqual(recommendation.proposedMutation, {
    entityType: 'Task',
    field: 'priority',
    proposedValue: 'HIGH',
  });
  assert.equal(
    recommendation.id,
    buildRecommendationId(
      'recommendations.escalate-blocked-overdue-task-priority.v0',
      recommendation.targetEntity,
    ),
  );
});

test('exact proposed priority is deterministic for LOW and MEDIUM tasks', () => {
  for (const priority of ['LOW', 'MEDIUM'] as const) {
    const snapshot = operationalSnapshotFixture({
      taskSignals: [qualifyingTaskSignal({ priority })],
    });
    const recommendation = generateRecommendationsFromDailyBriefingSnapshot(snapshot)
      .recommendations.find((item) => item.type === 'escalate_blocked_overdue_task_priority');

    assert.ok(recommendation);
    assert.equal(recommendation.proposedMutation?.proposedValue, 'HIGH');
  }
});

test('already HIGH or CRITICAL tasks do not produce operational priority recommendation', () => {
  for (const priority of ['HIGH', 'CRITICAL'] as const) {
    const snapshot = operationalSnapshotFixture({
      taskSignals: [qualifyingTaskSignal({ priority })],
    });
    const recommendation = generateRecommendationsFromDailyBriefingSnapshot(snapshot)
      .recommendations.find((item) => item.type === 'escalate_blocked_overdue_task_priority');

    assert.equal(recommendation, undefined);
  }
});

test('not blocked or not overdue tasks do not produce recommendation', () => {
  const notBlocked = generateRecommendationsFromDailyBriefingSnapshot(
    operationalSnapshotFixture({
      taskSignals: [qualifyingTaskSignal({ blocked: false })],
    }),
  ).recommendations.find((item) => item.type === 'escalate_blocked_overdue_task_priority');
  assert.equal(notBlocked, undefined);

  const notOverdue = generateRecommendationsFromDailyBriefingSnapshot(
    operationalSnapshotFixture({
      taskSignals: [qualifyingTaskSignal({ overdue: false })],
    }),
  ).recommendations.find((item) => item.type === 'escalate_blocked_overdue_task_priority');
  assert.equal(notOverdue, undefined);
});

test('project not at risk does not produce recommendation', () => {
  const snapshot = operationalSnapshotFixture({
    projectHighlights: [
      {
        projectId: 'project-1',
        projectName: 'Alpha Study',
        healthState: 'watch',
        attentionSeverity: 'medium',
        overdueTasks: 1,
        blockedTasks: 1,
        overdueMilestones: 0,
        dueSoonMilestones: 0,
        dueSoonTasks: 0,
        recentEventCount: 0,
      },
    ],
  });

  const recommendation = generateRecommendationsFromDailyBriefingSnapshot(snapshot)
    .recommendations.find((item) => item.type === 'escalate_blocked_overdue_task_priority');
  assert.equal(recommendation, undefined);
});

test('restricted task or project slices suppress recommendation generation', () => {
  const tasksRestricted = generateRecommendationsFromDailyBriefingSnapshot(
    operationalSnapshotFixture({
      metadata: {
        deterministic: true,
        restrictedSlices: ['tasks'],
        missionControlGeneratedAt: new Date('2026-07-26T12:00:00.000Z'),
      },
    }),
  ).recommendations.find((item) => item.type === 'escalate_blocked_overdue_task_priority');
  assert.equal(tasksRestricted, undefined);

  const projectsRestricted = generateRecommendationsFromDailyBriefingSnapshot(
    operationalSnapshotFixture({
      metadata: {
        deterministic: true,
        restrictedSlices: ['projects'],
        missionControlGeneratedAt: new Date('2026-07-26T12:00:00.000Z'),
      },
    }),
  ).recommendations.find((item) => item.type === 'escalate_blocked_overdue_task_priority');
  assert.equal(projectsRestricted, undefined);
});

test('missing required evidence suppresses recommendation emission', () => {
  const snapshot = operationalSnapshotFixture({ evidence: [] });
  const candidates = escalateBlockedOverdueTaskPriorityRule.evaluate({
    snapshot,
    organizationId: ORGANIZATION_ID,
    generatedAt: snapshot.generatedAt,
  });

  assert.equal(candidates.length, 1);

  const result = generateRecommendationsFromDailyBriefingSnapshot(snapshot);
  assert.equal(
    result.recommendations.some((item) => item.type === 'escalate_blocked_overdue_task_priority'),
    false,
  );
});

test('advisory recommendations remain without operational mutation metadata', () => {
  const snapshot = dailyBriefingSnapshotFixture({
    taskSignals: [],
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
  });

  const recommendations = generateRecommendationsFromDailyBriefingSnapshot(snapshot).recommendations;
  const advisory = recommendations.filter((item) => item.type !== 'escalate_blocked_overdue_task_priority');

  assert.ok(advisory.length > 0);
  assert.ok(advisory.every((item) => item.proposedMutation === undefined));
});

test('duplicate rule and task target deduplicates deterministically', () => {
  const snapshot = operationalSnapshotFixture({
    taskSignals: [qualifyingTaskSignal(), qualifyingTaskSignal()],
  });

  const recommendations = generateRecommendationsFromDailyBriefingSnapshot(snapshot).recommendations.filter(
    (item) => item.type === 'escalate_blocked_overdue_task_priority',
  );

  assert.equal(recommendations.length, 1);
});
