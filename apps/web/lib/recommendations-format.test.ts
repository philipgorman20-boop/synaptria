import assert from 'node:assert/strict';
import test from 'node:test';

import { organizationId } from '@synaptria/core';
import type { RecommendationReviewItem } from '@synaptria/application';

import {
  formatRecommendationReviewStatus,
  formatRecommendationType,
  getRecommendationEntityHref,
  RECOMMENDATIONS_ROUTE,
} from './recommendations-format';

const REVIEW_ITEM = {
  recommendation: {
    id: 'rec-1',
    type: 'resolve_blocked_critical_task',
    ruleId: 'recommendations.resolve-blocked-critical-task.v0',
    title: 'Review blocker on Assay transfer',
    rationale: 'Task is blocked.',
    priority: 'critical',
    targetEntity: {
      organizationId: organizationId('org-1'),
      entityType: 'Project',
      entityId: 'project-1',
    },
    proposedAction: { description: 'Review the blocking dependency.' },
    evidence: [
      {
        evidenceType: 'operationalEntity',
        reference: {
          organizationId: organizationId('org-1'),
          entityType: 'Task',
          entityId: 'task-1',
        },
        source: 'missionControl',
      },
      {
        evidenceType: 'operationalEntity',
        reference: {
          organizationId: organizationId('org-1'),
          entityType: 'Project',
          entityId: 'project-1',
        },
        source: 'missionControl',
      },
    ],
    confidence: 'high',
    generatedAt: new Date('2026-07-26T12:00:00.000Z'),
    status: 'proposed',
    metadata: {
      ruleId: 'recommendations.resolve-blocked-critical-task.v0',
      sourceSnapshotGeneratedAt: new Date('2026-07-26T12:00:00.000Z'),
      corroboratingSignalCount: 2,
    },
  },
  review: { status: 'pending' },
} satisfies RecommendationReviewItem;

test('recommendations route helper exposes the authenticated review route', () => {
  assert.equal(RECOMMENDATIONS_ROUTE, '/recommendations');
});

test('formatters expose accessible recommendation labels', () => {
  assert.equal(formatRecommendationType('escalate_overdue_milestone'), 'Overdue milestone');
  assert.equal(formatRecommendationReviewStatus('accepted'), 'Accepted');
  assert.equal(getRecommendationEntityHref(REVIEW_ITEM.recommendation.targetEntity), '/projects/project-1');
});
