import assert from 'node:assert/strict';
import test from 'node:test';

import { identifier, organizationId } from '@synaptria/core';
import { AuthorizationDeniedError } from '@synaptria/core/errors';

import { dailyBriefingSnapshotFixture } from '../daily-briefing/narrative/testing/fixtures';
import type { DailyBriefingSnapshot } from '../daily-briefing/types';
import type { DailyBriefingSnapshotReader } from './daily-briefing-snapshot-reader';
import { buildRecommendationId } from './recommendation-id';
import {
  GenerateRecommendationsUseCase,
  generateRecommendationsFromDailyBriefingSnapshot,
} from './generate-recommendations';
import { RecommendationService } from './recommendations-service';
import { resolveBlockedCriticalTaskRule } from './rules/resolve-blocked-critical-task.rule';
import type { Recommendation } from './types';

const ORGANIZATION_ID = organizationId('org-1');
const GENERATED_AT = new Date('2026-07-26T12:00:00.000Z');
const CONTEXT = { organizationId: ORGANIZATION_ID, role: 'MEMBER' as const };

function createDailyBriefingSnapshotReader(
  snapshot: DailyBriefingSnapshot,
): DailyBriefingSnapshotReader {
  return {
    getSnapshot: async () => snapshot,
  };
}

function healthySnapshotFixture(): DailyBriefingSnapshot {
  return dailyBriefingSnapshotFixture({
    executiveSignals: {
      activeProjects: 1,
      projectsAtRisk: 0,
      overdueTasks: 0,
      blockedTasks: 0,
      overdueMilestones: 0,
      dueSoonMilestones: 0,
      dueSoonTasks: 0,
      recentOrganizationEvents: 0,
      changedProjectCount: 0,
    },
    attentionItems: [],
    projectHighlights: [
      {
        projectId: 'project-1',
        projectName: 'Alpha Study',
        healthState: 'on_track',
        attentionSeverity: 'low',
        overdueTasks: 0,
        blockedTasks: 0,
        overdueMilestones: 0,
        dueSoonMilestones: 1,
        dueSoonTasks: 1,
        recentEventCount: 0,
      },
    ],
    upcomingWork: [],
    recentChanges: [],
    evidence: [
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
}

function blockedCriticalTaskSnapshotFixture(): DailyBriefingSnapshot {
  return dailyBriefingSnapshotFixture({
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
  });
}

function overdueMilestoneSnapshotFixture(): DailyBriefingSnapshot {
  return dailyBriefingSnapshotFixture({
    attentionItems: [
      {
        type: 'overdue_milestone',
        severity: 'high',
        entity: { entityType: 'Milestone', entityId: 'milestone-overdue' },
        title: 'Protocol Draft',
        reason: 'Milestone is overdue.',
        dueDate: '2026-07-20T12:00:00.000Z',
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
  });
}

function concentratedRiskSnapshotFixture(): DailyBriefingSnapshot {
  return dailyBriefingSnapshotFixture({
    attentionItems: [],
    projectHighlights: [
      {
        projectId: 'project-1',
        projectName: 'Alpha Study',
        healthState: 'at_risk',
        attentionSeverity: 'high',
        overdueTasks: 2,
        blockedTasks: 1,
        overdueMilestones: 1,
        dueSoonMilestones: 0,
        dueSoonTasks: 0,
        recentEventCount: 2,
      },
    ],
    evidence: [
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
}

function nearTermWorkloadSnapshotFixture(): DailyBriefingSnapshot {
  return dailyBriefingSnapshotFixture({
    attentionItems: [],
    projectHighlights: [
      {
        projectId: 'project-1',
        projectName: 'Alpha Study',
        healthState: 'watch',
        attentionSeverity: 'medium',
        overdueTasks: 0,
        blockedTasks: 0,
        overdueMilestones: 0,
        dueSoonMilestones: 2,
        dueSoonTasks: 2,
        recentEventCount: 0,
      },
    ],
    evidence: [
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
}

test('no recommendations for empty or healthy organization snapshots', () => {
  const result = generateRecommendationsFromDailyBriefingSnapshot(healthySnapshotFixture());
  assert.equal(result.recommendations.length, 0);
});

test('blocked critical task recommendation is generated for blocked tasks on at-risk projects', () => {
  const result = generateRecommendationsFromDailyBriefingSnapshot(
    blockedCriticalTaskSnapshotFixture(),
  );

  assert.equal(result.recommendations.length, 1);
  const recommendation = result.recommendations[0];
  assert.equal(recommendation?.type, 'resolve_blocked_critical_task');
  assert.equal(recommendation?.priority, 'critical');
  assert.equal(recommendation?.targetEntity.entityType, 'Task');
  assert.equal(recommendation?.targetEntity.entityId, 'task-blocked');
  assert.ok(recommendation?.evidence.length >= 2);
  assert.match(recommendation?.title ?? '', /Assay transfer/i);
});

test('overdue milestone recommendation is generated for high-severity overdue milestones', () => {
  const result = generateRecommendationsFromDailyBriefingSnapshot(
    overdueMilestoneSnapshotFixture(),
  );

  assert.equal(result.recommendations.length, 1);
  const recommendation = result.recommendations[0];
  assert.equal(recommendation?.type, 'escalate_overdue_milestone');
  assert.equal(recommendation?.targetEntity.entityType, 'Milestone');
  assert.ok(recommendation?.evidence.some((item) => item.evidenceType === 'operationalEntity'));
});

test('concentrated project execution risk recommendation is generated', () => {
  const result = generateRecommendationsFromDailyBriefingSnapshot(
    concentratedRiskSnapshotFixture(),
  );

  const recommendation = result.recommendations.find(
    (item) => item.type === 'review_concentrated_execution_risk',
  );
  assert.ok(recommendation);
  assert.equal(recommendation?.targetEntity.entityType, 'Project');
  assert.match(recommendation?.rationale ?? '', /overdue tasks/i);
});

test('near-term workload recommendation is generated when due-soon signals exceed threshold', () => {
  const result = generateRecommendationsFromDailyBriefingSnapshot(
    nearTermWorkloadSnapshotFixture(),
  );

  const recommendation = result.recommendations.find(
    (item) => item.type === 'rebalance_near_term_workload',
  );
  assert.ok(recommendation);
  assert.equal(recommendation?.priority, 'medium');
});

test('recommendations are ordered by deterministic priority', () => {
  const snapshot = dailyBriefingSnapshotFixture({
    attentionItems: [
      {
        type: 'overdue_milestone',
        severity: 'high',
        entity: { entityType: 'Milestone', entityId: 'milestone-overdue' },
        title: 'Protocol Draft',
        reason: 'Milestone is overdue.',
        projectId: 'project-1',
      },
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
        overdueTasks: 2,
        blockedTasks: 2,
        overdueMilestones: 1,
        dueSoonMilestones: 2,
        dueSoonTasks: 2,
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
  });

  const result = generateRecommendationsFromDailyBriefingSnapshot(snapshot);
  assert.ok(result.recommendations.length >= 2);
  assert.equal(result.recommendations[0]?.priority, 'critical');
});

test('recommendations without resolvable evidence are omitted', () => {
  const candidates = resolveBlockedCriticalTaskRule.evaluate({
    snapshot: blockedCriticalTaskSnapshotFixture(),
    organizationId: ORGANIZATION_ID,
    generatedAt: GENERATED_AT,
  });

  assert.equal(candidates.length, 1);

  const withoutEvidence = generateRecommendationsFromDailyBriefingSnapshot(
    dailyBriefingSnapshotFixture({
      attentionItems: blockedCriticalTaskSnapshotFixture().attentionItems,
      projectHighlights: blockedCriticalTaskSnapshotFixture().projectHighlights,
      evidence: [],
    }),
  );

  assert.equal(withoutEvidence.recommendations.length, 0);
});

test('duplicate rule/target recommendations are deduplicated within one generation run', () => {
  const blockedSnapshot = blockedCriticalTaskSnapshotFixture();
  const duplicateAttentionItem = blockedSnapshot.attentionItems[0];
  assert.ok(duplicateAttentionItem);

  const snapshot = dailyBriefingSnapshotFixture({
    attentionItems: [duplicateAttentionItem, duplicateAttentionItem],
    projectHighlights: blockedSnapshot.projectHighlights,
    evidence: blockedSnapshot.evidence,
  });

  const result = generateRecommendationsFromDailyBriefingSnapshot(snapshot);

  assert.equal(
    result.recommendations.filter(
      (recommendation) => recommendation.type === 'resolve_blocked_critical_task',
    ).length,
    1,
  );
  assert.ok(
    result.recommendations.every(
      (recommendation, index, all) =>
        all.findIndex(
          (other) =>
            other.ruleId === recommendation.ruleId &&
            other.targetEntity.entityId === recommendation.targetEntity.entityId,
        ) === index,
    ),
  );
});

test('recommendation IDs are stable for identical input snapshots', () => {
  const snapshot = blockedCriticalTaskSnapshotFixture();
  const first = generateRecommendationsFromDailyBriefingSnapshot(snapshot);
  const second = generateRecommendationsFromDailyBriefingSnapshot(snapshot);

  assert.deepEqual(
    first.recommendations.map((item) => item.id),
    second.recommendations.map((item) => item.id),
  );

  const recommendation = first.recommendations[0];
  assert.ok(recommendation);
  assert.equal(
    recommendation.id,
    buildRecommendationId(recommendation.ruleId, recommendation.targetEntity),
  );
});

test('restricted task slice prevents task-derived recommendations', () => {
  const blockedSnapshot = blockedCriticalTaskSnapshotFixture();
  const result = generateRecommendationsFromDailyBriefingSnapshot(
    dailyBriefingSnapshotFixture({
      attentionItems: blockedSnapshot.attentionItems,
      projectHighlights: blockedSnapshot.projectHighlights,
      evidence: blockedSnapshot.evidence,
      metadata: {
        deterministic: true,
        restrictedSlices: ['tasks'],
        missionControlGeneratedAt: GENERATED_AT,
      },
    }),
  );

  assert.equal(
    result.recommendations.some((item) => item.type === 'resolve_blocked_critical_task'),
    false,
  );
});

test('restricted milestone slice prevents milestone-derived recommendations', () => {
  const overdueSnapshot = overdueMilestoneSnapshotFixture();
  const result = generateRecommendationsFromDailyBriefingSnapshot(
    dailyBriefingSnapshotFixture({
      attentionItems: overdueSnapshot.attentionItems,
      evidence: overdueSnapshot.evidence,
      metadata: {
        deterministic: true,
        restrictedSlices: ['milestones'],
        missionControlGeneratedAt: GENERATED_AT,
      },
    }),
  );

  assert.equal(
    result.recommendations.some((item) => item.type === 'escalate_overdue_milestone'),
    false,
  );
});

test('recommendations do not expose data from restricted slices', () => {
  const result = generateRecommendationsFromDailyBriefingSnapshot(
    dailyBriefingSnapshotFixture({
      metadata: {
        deterministic: true,
        restrictedSlices: ['tasks', 'milestones'],
        missionControlGeneratedAt: GENERATED_AT,
      },
      attentionItems: [
        {
          type: 'blocked_task',
          severity: 'critical',
          entity: { entityType: 'Task', entityId: 'hidden-task' },
          title: 'Hidden blocked task',
          reason: 'Should not appear in recommendations.',
          projectId: 'project-1',
        },
        {
          type: 'overdue_milestone',
          severity: 'critical',
          entity: { entityType: 'Milestone', entityId: 'hidden-milestone' },
          title: 'Hidden milestone',
          reason: 'Should not appear in recommendations.',
          projectId: 'project-1',
        },
      ],
      projectHighlights: [
        {
          projectId: 'project-1',
          projectName: 'Alpha Study',
          healthState: 'on_track',
          attentionSeverity: 'low',
          overdueTasks: 0,
          blockedTasks: 0,
          overdueMilestones: 0,
          dueSoonMilestones: 1,
          dueSoonTasks: 1,
          recentEventCount: 0,
        },
      ],
      evidence: [
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

  assert.equal(result.recommendations.some((item) => item.title.includes('Hidden')), false);
  assert.equal(
    result.recommendations.every((item) => item.targetEntity.entityType === 'Project'),
    true,
  );
});

test('generation is deterministically repeatable for identical snapshots', () => {
  const snapshot = dailyBriefingSnapshotFixture({
    attentionItems: blockedCriticalTaskSnapshotFixture().attentionItems,
    projectHighlights: concentratedRiskSnapshotFixture().projectHighlights,
    evidence: blockedCriticalTaskSnapshotFixture().evidence,
  });

  const first = generateRecommendationsFromDailyBriefingSnapshot(snapshot);
  const second = generateRecommendationsFromDailyBriefingSnapshot(snapshot);

  assert.deepEqual(first, second);
});

test('GenerateRecommendationsUseCase accepts a minimal DailyBriefingSnapshotReader fake', async () => {
  const snapshot = blockedCriticalTaskSnapshotFixture();
  const useCase = new GenerateRecommendationsUseCase({
    dailyBriefingSnapshotReader: createDailyBriefingSnapshotReader(snapshot),
  });

  const result = await useCase.execute(CONTEXT);

  assert.equal(result.recommendations.length, 1);
  assert.equal(result.recommendations[0]?.type, 'resolve_blocked_critical_task');
});

test('RecommendationService facade delegates to GenerateRecommendationsUseCase', async () => {
  const snapshot = blockedCriticalTaskSnapshotFixture();
  const service = new RecommendationService(
    new GenerateRecommendationsUseCase({
      dailyBriefingSnapshotReader: createDailyBriefingSnapshotReader(snapshot),
    }),
  );

  const result = await service.getRecommendations(CONTEXT);
  assert.equal(result.recommendations.length, 1);
});

test('GenerateRecommendationsUseCase enforces recommendations access policy', async () => {
  const useCase = new GenerateRecommendationsUseCase({
    dailyBriefingSnapshotReader: createDailyBriefingSnapshotReader(healthySnapshotFixture()),
    accessPolicy: {
      canAccessRecommendations: () => false,
    },
  });

  await assert.rejects(
    () => useCase.execute(CONTEXT),
    (error: unknown) => error instanceof AuthorizationDeniedError,
  );
});

test('all generated recommendations remain in proposed status with deterministic confidence', () => {
  const result = generateRecommendationsFromDailyBriefingSnapshot(
    dailyBriefingSnapshotFixture({
      attentionItems: [
        ...blockedCriticalTaskSnapshotFixture().attentionItems,
        ...overdueMilestoneSnapshotFixture().attentionItems,
      ],
      projectHighlights: concentratedRiskSnapshotFixture().projectHighlights,
      evidence: [
        ...blockedCriticalTaskSnapshotFixture().evidence,
        {
          evidenceType: 'operationalEntity',
          reference: {
            organizationId: ORGANIZATION_ID,
            entityType: 'Milestone',
            entityId: 'milestone-overdue',
          },
          source: 'missionControl',
        },
      ],
    }),
  );

  for (const recommendation of result.recommendations) {
    assert.equal(recommendation.status, 'proposed');
    assert.ok(['high', 'medium', 'low'].includes(recommendation.confidence));
    assert.ok(recommendation.proposedAction.description.length > 0);
    assert.ok(recommendation.metadata.ruleId.length > 0);
  }
});
