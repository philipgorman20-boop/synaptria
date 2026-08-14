import assert from 'node:assert/strict';
import test from 'node:test';

import { organizationId } from '@synaptria/core';
import type { ActionProposalListItem } from '@synaptria/application';
import type { ActionProposal } from '@synaptria/domain/action-proposals';
import { PERMISSIONS, hasPermission } from '@synaptria/permissions';

import {
  ACTION_PROPOSALS_SUBTITLE,
  ACTION_PROPOSALS_TITLE,
  formatActionProposalActionType,
  formatActionProposalEntityLabel,
  formatActionProposalKind,
  formatActionProposalPreconditionValidationStatus,
  formatActionProposalScalarValue,
  getActionProposalEvidenceHref,
  getActionProposalInspectionHref,
} from './action-proposals-format';

const PROPOSAL = {
  id: 'ap:rec-1',
  organizationId: organizationId('org-1'),
  recommendationId: 'rec-1',
  recommendationType: 'resolve_blocked_critical_task',
  actionType: 'REQUEST_TASK_BLOCKER_REVIEW',
  proposalKind: 'ADVISORY',
  target: { entityType: 'Task', entityId: 'task-1' },
  title: 'Advisory review: Blocked task',
  description: 'Review the blocking dependency.',
  proposedChanges: [],
  preconditions: [],
  evidenceKeys: ['entity:Task:task-1'],
  status: 'PROPOSED',
  createdAt: new Date('2026-07-26T12:00:00.000Z'),
} satisfies ActionProposal;

const OPERATIONAL_PROPOSAL = {
  ...PROPOSAL,
  proposalKind: 'OPERATIONAL',
  title: 'Operational change: Unblock task',
  proposedChanges: [
    { field: 'status', currentValue: 'BLOCKED', proposedValue: 'IN_PROGRESS' },
  ],
  preconditions: [{ field: 'status', expectedValue: 'BLOCKED' }],
} satisfies ActionProposal;

const LIST_ITEM = {
  proposal: PROPOSAL,
  source: {
    recommendationId: 'rec-1',
    targetEntity: {
      organizationId: organizationId('org-1'),
      entityType: 'Task',
      entityId: 'task-1',
    },
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
  },
  validation: {
    status: 'NOT_APPLICABLE',
    issues: [],
  },
} satisfies ActionProposalListItem;

test('action proposals surface copy states that no actions are executed', () => {
  assert.match(ACTION_PROPOSALS_SUBTITLE, /No actions are executed/i);
  assert.equal(ACTION_PROPOSALS_TITLE, 'Action Proposals');
});

test('formatters expose readable action proposal labels', () => {
  assert.equal(
    formatActionProposalActionType('REQUEST_TASK_BLOCKER_REVIEW'),
    'Task blocker review',
  );
  assert.equal(formatActionProposalKind('ADVISORY'), 'Advisory review');
  assert.equal(formatActionProposalKind('OPERATIONAL'), 'Operational change');
  assert.equal(formatActionProposalPreconditionValidationStatus('CURRENT'), 'Current');
  assert.equal(formatActionProposalPreconditionValidationStatus('STALE'), 'Stale');
  assert.equal(
    formatActionProposalPreconditionValidationStatus('NOT_APPLICABLE'),
    'Not applicable',
  );
  assert.equal(getActionProposalInspectionHref('rec-1'), '/action-proposals#rec-1');
});

test('member and viewer retain read access without AI review permission', () => {
  assert.equal(hasPermission('MEMBER', PERMISSIONS.DASHBOARD_READ), true);
  assert.equal(hasPermission('VIEWER', PERMISSIONS.DASHBOARD_READ), true);
  assert.equal(hasPermission('MEMBER', PERMISSIONS.AI_REVIEW), false);
  assert.equal(hasPermission('VIEWER', PERMISSIONS.AI_REVIEW), false);
});

test('evidence labels use human entity types instead of raw evidence keys', () => {
  assert.equal(
    formatActionProposalEntityLabel(LIST_ITEM.source.evidence[0]!.reference),
    'Task',
  );
  assert.equal(
    formatActionProposalEntityLabel(LIST_ITEM.source.evidence[1]!.reference),
    'Project',
  );
});

test('task evidence falls back to linked project route when direct entity route is unavailable', () => {
  const taskEvidence = LIST_ITEM.source.evidence[0]!;
  assert.equal(taskEvidence.evidenceType, 'operationalEntity');

  const href = getActionProposalEvidenceHref(LIST_ITEM.source.evidence, taskEvidence.reference);
  assert.equal(href, '/projects/project-1');
});

test('advisory proposals reserve proposedChanges for future operational field mutations', () => {
  assert.deepEqual(PROPOSAL.proposedChanges, []);
  assert.deepEqual(PROPOSAL.preconditions, []);
});

test('operational scalar formatting supports inspection display', () => {
  assert.equal(formatActionProposalScalarValue('BLOCKED'), 'BLOCKED');
  assert.equal(formatActionProposalScalarValue(null), 'None');
  assert.equal(OPERATIONAL_PROPOSAL.proposedChanges[0]?.currentValue, 'BLOCKED');
});
