import assert from 'node:assert/strict';
import test from 'node:test';

import { organizationId } from '@synaptria/core';
import type { ActionExecutionRequestSnapshot } from '@synaptria/domain/action-executions';

import { computeActionExecutionSnapshotFingerprint } from './snapshot-fingerprint';

const ORG_A = organizationId('org-a');

function snapshot(): ActionExecutionRequestSnapshot {
  return {
    actionProposalId: 'ap:rec-1',
    recommendationId: 'rec-1',
    actionType: 'ESCALATE_BLOCKED_OVERDUE_TASK_PRIORITY',
    target: { entityType: 'Task', entityId: 'task-1' },
    proposedChanges: [
      { field: 'priority', currentValue: 'MEDIUM', proposedValue: 'HIGH' },
    ],
    preconditions: [
      { field: 'priority', expectedValue: 'MEDIUM' },
      { field: 'updatedAt', expectedValue: '2026-07-26T12:00:00.000Z' },
    ],
  };
}

test('computeActionExecutionSnapshotFingerprint is deterministic', () => {
  const first = computeActionExecutionSnapshotFingerprint(ORG_A, snapshot());
  const second = computeActionExecutionSnapshotFingerprint(ORG_A, snapshot());
  assert.equal(first, second);
  assert.match(first, /^[a-f0-9]{64}$/);
});
