import assert from 'node:assert/strict';
import test from 'node:test';

import { organizationId, userId } from '@synaptria/core';
import { AuthorizationDeniedError } from '@synaptria/core/errors';
import type { RecommendationReviewDecision } from '@synaptria/domain/recommendation-reviews';

import { dailyBriefingSnapshotFixture } from '../daily-briefing/narrative/testing/fixtures';
import { generateRecommendationsFromDailyBriefingSnapshot } from '../recommendations/generate-recommendations';
import type { RecommendationsSnapshot } from '../recommendations/types';
import { buildActionProposalId } from './build-action-proposal-id';
import {
  buildActionProposalFromRecommendation,
  buildRecommendationEvidenceKeys,
  isSupportedActionProposalRecommendation,
} from './build-action-proposal-from-recommendation';
import {
  GetActionProposalUseCase,
  GetActionProposalsUseCase,
} from './get-action-proposals';
import type { RecommendationReviewDecisionReader } from './recommendation-review-decision-reader';
import type { RecommendationSnapshotReader } from './recommendation-snapshot-reader';

const ORGANIZATION_ID = organizationId('org-1');
const USER_ID = userId('user-1');
const REVIEWED_AT = new Date('2026-07-26T14:00:00.000Z');
const READ_CONTEXT = { organizationId: ORGANIZATION_ID, role: 'MEMBER' as const };

function blockedTaskRecommendationsSnapshot(): RecommendationsSnapshot {
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

function workloadRecommendationsSnapshot(): RecommendationsSnapshot {
  return generateRecommendationsFromDailyBriefingSnapshot(
    dailyBriefingSnapshotFixture({
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
    }),
  );
}

class InMemoryRecommendationReviewDecisionReader implements RecommendationReviewDecisionReader {
  constructor(private readonly decisions: readonly RecommendationReviewDecision[] = []) {}

  async findByRecommendationIds(
    organizationId: string,
    recommendationIds: readonly string[],
  ): Promise<readonly RecommendationReviewDecision[]> {
    return this.decisions.filter(
      (decision) =>
        decision.organizationId === organizationId &&
        recommendationIds.includes(decision.recommendationId),
    );
  }
}

function createReaders(input: {
  snapshot: RecommendationsSnapshot;
  decisions?: readonly RecommendationReviewDecision[];
}): {
  recommendationSnapshotReader: RecommendationSnapshotReader;
  recommendationReviewDecisionReader: RecommendationReviewDecisionReader;
} {
  return {
    recommendationSnapshotReader: {
      getRecommendations: async () => input.snapshot,
    },
    recommendationReviewDecisionReader: new InMemoryRecommendationReviewDecisionReader(
      input.decisions ?? [],
    ),
  };
}

function acceptedDecision(recommendationId: string): RecommendationReviewDecision {
  return {
    id: 'decision-1',
    organizationId: ORGANIZATION_ID,
    recommendationId,
    decision: 'accepted',
    reviewedByUserId: USER_ID,
    reviewedAt: REVIEWED_AT,
  };
}

test('accepted supported recommendation produces a deterministic action proposal', () => {
  const snapshot = blockedTaskRecommendationsSnapshot();
  const recommendation = snapshot.recommendations[0];
  assert.ok(recommendation);

  const first = buildActionProposalFromRecommendation(recommendation);
  const second = buildActionProposalFromRecommendation(recommendation);

  assert.deepEqual(first, second);
  assert.ok(first);
  assert.equal(first.recommendationId, recommendation.id);
  assert.equal(first.recommendationType, 'resolve_blocked_critical_task');
  assert.equal(first.actionType, 'REQUEST_TASK_BLOCKER_REVIEW');
  assert.equal(first.proposalKind, 'ADVISORY');
  assert.deepEqual(first.proposedChanges, []);
  assert.equal(first.id, buildActionProposalId(recommendation.id));
});

test('proposal evidence keys are derived from recommendation evidence only', () => {
  const recommendation = blockedTaskRecommendationsSnapshot().recommendations[0];
  assert.ok(recommendation);

  const proposal = buildActionProposalFromRecommendation(recommendation);
  assert.ok(proposal);

  const recommendationEvidenceKeys = buildRecommendationEvidenceKeys(recommendation);
  assert.deepEqual(proposal.evidenceKeys, recommendationEvidenceKeys);
  assert.ok(
    proposal.evidenceKeys.every((key) => recommendationEvidenceKeys.includes(key)),
  );
});

test('all supported recommendation types produce advisory proposals without fabricated changes', () => {
  const blockedTask = blockedTaskRecommendationsSnapshot().recommendations[0];
  assert.ok(blockedTask);

  const blockedProposal = buildActionProposalFromRecommendation(blockedTask);
  assert.ok(blockedProposal);
  assert.equal(blockedProposal.actionType, 'REQUEST_TASK_BLOCKER_REVIEW');
  assert.equal(blockedProposal.proposalKind, 'ADVISORY');
  assert.deepEqual(blockedProposal.proposedChanges, []);

  const overdueSnapshot = generateRecommendationsFromDailyBriefingSnapshot(
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
      projectHighlights: [
        {
          projectId: 'project-1',
          projectName: 'Alpha Study',
          healthState: 'at_risk',
          attentionSeverity: 'high',
          overdueTasks: 0,
          blockedTasks: 0,
          overdueMilestones: 1,
          dueSoonMilestones: 0,
          dueSoonTasks: 0,
          recentEventCount: 0,
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
  const overdueMilestone = overdueSnapshot.recommendations[0];
  assert.ok(overdueMilestone);
  assert.equal(overdueMilestone.type, 'escalate_overdue_milestone');

  const overdueProposal = buildActionProposalFromRecommendation(overdueMilestone);
  assert.ok(overdueProposal);
  assert.equal(overdueProposal.actionType, 'REQUEST_MILESTONE_RECOVERY_REVIEW');
  assert.deepEqual(overdueProposal.proposedChanges, []);

  const workload = workloadRecommendationsSnapshot().recommendations[0];
  assert.ok(workload);

  const workloadProposal = buildActionProposalFromRecommendation(workload);
  assert.ok(workloadProposal);
  assert.equal(workloadProposal.actionType, 'REQUEST_WORKLOAD_REBALANCE_REVIEW');
  assert.deepEqual(workloadProposal.proposedChanges, []);
});

test('pending recommendations do not produce action proposals', async () => {
  const snapshot = blockedTaskRecommendationsSnapshot();
  const result = await new GetActionProposalsUseCase(
    createReaders({ snapshot, decisions: [] }),
  ).execute(READ_CONTEXT);

  assert.equal(result.proposals.length, 0);
});

test('dismissed recommendations do not produce action proposals', async () => {
  const snapshot = blockedTaskRecommendationsSnapshot();
  const recommendationId = snapshot.recommendations[0]?.id;
  assert.ok(recommendationId);

  const result = await new GetActionProposalsUseCase(
    createReaders({
      snapshot,
      decisions: [
        {
          ...acceptedDecision(recommendationId),
          decision: 'dismissed',
        },
      ],
    }),
  ).execute(READ_CONTEXT);

  assert.equal(result.proposals.length, 0);
});

test('accepted recommendations produce proposals only when still present in the current snapshot', async () => {
  const snapshot = blockedTaskRecommendationsSnapshot();
  const recommendationId = snapshot.recommendations[0]?.id;
  assert.ok(recommendationId);

  const result = await new GetActionProposalsUseCase(
    createReaders({
      snapshot,
      decisions: [acceptedDecision(recommendationId)],
    }),
  ).execute(READ_CONTEXT);

  assert.equal(result.proposals.length, 1);
});

test('stale accepted review decisions do not produce proposals for missing recommendations', async () => {
  const snapshot = blockedTaskRecommendationsSnapshot();

  const result = await new GetActionProposalsUseCase(
    createReaders({
      snapshot: generateRecommendationsFromDailyBriefingSnapshot(dailyBriefingSnapshotFixture()),
      decisions: [
        acceptedDecision('rec:stale:entity:Task:missing-task'),
      ],
    }),
  ).execute(READ_CONTEXT);

  assert.equal(result.proposals.length, 0);
});

test('getActionProposal rejects non-accepted recommendations without trusting client flags', async () => {
  const snapshot = blockedTaskRecommendationsSnapshot();
  const recommendationId = snapshot.recommendations[0]?.id;
  assert.ok(recommendationId);

  await assert.rejects(
    () =>
      new GetActionProposalUseCase(createReaders({ snapshot, decisions: [] })).execute(
        READ_CONTEXT,
        recommendationId,
      ),
    (error: unknown) => error instanceof Error && 'code' in error && error.code === 'NOT_FOUND',
  );
});

test('authorized read roles can inspect action proposals', async () => {
  const snapshot = blockedTaskRecommendationsSnapshot();
  const recommendationId = snapshot.recommendations[0]?.id;
  assert.ok(recommendationId);

  const memberResult = await new GetActionProposalsUseCase(
    createReaders({
      snapshot,
      decisions: [acceptedDecision(recommendationId)],
    }),
  ).execute({ organizationId: ORGANIZATION_ID, role: 'MEMBER' });

  const viewerResult = await new GetActionProposalsUseCase(
    createReaders({
      snapshot,
      decisions: [acceptedDecision(recommendationId)],
    }),
  ).execute({ organizationId: ORGANIZATION_ID, role: 'VIEWER' });

  assert.equal(memberResult.proposals.length, 1);
  assert.equal(viewerResult.proposals.length, 1);
});

test('action proposals access is denied without dashboard read permission', async () => {
  await assert.rejects(
    () =>
      new GetActionProposalsUseCase({
        ...createReaders({ snapshot: blockedTaskRecommendationsSnapshot() }),
        accessPolicy: { canReadActionProposals: () => false },
      }).execute(READ_CONTEXT),
    (error: unknown) => error instanceof AuthorizationDeniedError,
  );
});

test('action proposals are deterministically ordered by recommendation priority', async () => {
  const snapshot = generateRecommendationsFromDailyBriefingSnapshot(
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

  const decisions = snapshot.recommendations.map((recommendation) =>
    acceptedDecision(recommendation.id),
  );

  const result = await new GetActionProposalsUseCase(
    createReaders({ snapshot, decisions }),
  ).execute(READ_CONTEXT);

  assert.equal(result.proposals.length, 2);
  assert.equal(result.proposals[0]?.proposal.recommendationType, 'resolve_blocked_critical_task');
});

test('supported recommendation types are explicitly allowlisted', () => {
  const recommendation = blockedTaskRecommendationsSnapshot().recommendations[0];
  assert.ok(recommendation);
  assert.equal(isSupportedActionProposalRecommendation(recommendation), true);
});

test('proposal generation does not invoke operational repositories or execution services', async () => {
  const snapshot = blockedTaskRecommendationsSnapshot();
  const recommendationId = snapshot.recommendations[0]?.id;
  assert.ok(recommendationId);

  const readers = createReaders({
    snapshot,
    decisions: [acceptedDecision(recommendationId)],
  });

  const result = await new GetActionProposalsUseCase(readers).execute(READ_CONTEXT);
  assert.equal(result.proposals[0]?.proposal.status, 'PROPOSED');
  assert.deepEqual(result.proposals[0]?.proposal.proposedChanges, []);
  assert.equal(result.proposals[0]?.source.recommendationId, recommendationId);
});
