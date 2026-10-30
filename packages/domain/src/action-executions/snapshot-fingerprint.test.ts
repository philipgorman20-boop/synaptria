import assert from 'node:assert/strict';
import test from 'node:test';

import { organizationId } from '@synaptria/core';

import { buildActionExecutionSnapshotCanonicalPayload } from './snapshot-fingerprint';
import type { ActionExecutionRequestSnapshot } from './models';

const ORG_A = organizationId('org-a');
const ORG_B = organizationId('org-b');

function snapshot(overrides: Partial<ActionExecutionRequestSnapshot> = {}): ActionExecutionRequestSnapshot {
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
    ...overrides,
  };
}

test('identical snapshots produce identical canonical payloads', () => {
  const first = buildActionExecutionSnapshotCanonicalPayload(ORG_A, snapshot());
  const second = buildActionExecutionSnapshotCanonicalPayload(ORG_A, snapshot());
  assert.equal(first, second);
});

test('changed current priority produces a different canonical payload', () => {
  const baseline = buildActionExecutionSnapshotCanonicalPayload(ORG_A, snapshot());
  const changed = buildActionExecutionSnapshotCanonicalPayload(
    ORG_A,
    snapshot({
      proposedChanges: [
        { field: 'priority', currentValue: 'LOW', proposedValue: 'HIGH' },
      ],
      preconditions: [
        { field: 'priority', expectedValue: 'LOW' },
        { field: 'updatedAt', expectedValue: '2026-07-26T12:00:00.000Z' },
      ],
    }),
  );
  assert.notEqual(baseline, changed);
});

test('changed updatedAt precondition produces a different canonical payload', () => {
  const baseline = buildActionExecutionSnapshotCanonicalPayload(ORG_A, snapshot());
  const changed = buildActionExecutionSnapshotCanonicalPayload(
    ORG_A,
    snapshot({
      preconditions: [
        { field: 'priority', expectedValue: 'MEDIUM' },
        { field: 'updatedAt', expectedValue: '2026-07-26T13:00:00.000Z' },
      ],
    }),
  );
  assert.notEqual(baseline, changed);
});

test('organizations are isolated in canonical payload', () => {
  const orgA = buildActionExecutionSnapshotCanonicalPayload(ORG_A, snapshot());
  const orgB = buildActionExecutionSnapshotCanonicalPayload(ORG_B, snapshot());
  assert.notEqual(orgA, orgB);
});

test('canonicalization ignores proposedChanges and preconditions ordering', () => {
  const ordered = snapshot({
    preconditions: [
      { field: 'priority', expectedValue: 'MEDIUM' },
      { field: 'updatedAt', expectedValue: '2026-07-26T12:00:00.000Z' },
    ],
  });
  const reordered = snapshot({
    preconditions: [
      { field: 'updatedAt', expectedValue: '2026-07-26T12:00:00.000Z' },
      { field: 'priority', expectedValue: 'MEDIUM' },
    ],
  });

  assert.equal(
    buildActionExecutionSnapshotCanonicalPayload(ORG_A, ordered),
    buildActionExecutionSnapshotCanonicalPayload(ORG_A, reordered),
  );
});
