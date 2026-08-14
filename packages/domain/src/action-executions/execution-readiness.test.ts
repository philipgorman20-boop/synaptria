import assert from 'node:assert/strict';
import test from 'node:test';

import { organizationId, userId } from '@synaptria/core';

import { validateExecutionRequestReadiness } from './execution-readiness';
import type { ActionExecutionRequest } from './models';

const ORGANIZATION_ID = organizationId('org-1');

function requestFixture(
  overrides: Partial<ActionExecutionRequest> = {},
): ActionExecutionRequest {
  const snapshot = overrides.snapshot ?? {
    actionProposalId: 'ap:rec-1',
    recommendationId: 'rec-1',
    actionType: 'ESCALATE_BLOCKED_OVERDUE_TASK_PRIORITY',
    target: { entityType: 'Task' as const, entityId: 'task-1' },
    proposedChanges: [
      { field: 'priority', currentValue: 'MEDIUM' as const, proposedValue: 'HIGH' as const },
    ],
    preconditions: [
      { field: 'priority', expectedValue: 'MEDIUM' as const },
      { field: 'updatedAt', expectedValue: '2026-07-26T12:00:00.000Z' },
    ],
  };
  const { snapshot: _snapshot, snapshotFingerprint: _fingerprint, ...rest } = overrides;

  return {
    id: 'exec-req-1',
    organizationId: ORGANIZATION_ID,
    requestedByUserId: userId('user-1'),
    requestedAt: new Date('2026-07-26T14:00:00.000Z'),
    status: 'PENDING_CONFIRMATION',
    createIdempotencyKey: 'create-key-1',
    snapshotFingerprint: overrides.snapshotFingerprint ?? 'snapshot-fingerprint-test',
    ...rest,
    snapshot,
  };
}

test('validateExecutionRequestReadiness returns READY when preconditions match', () => {
  const result = validateExecutionRequestReadiness({
    request: requestFixture(),
    organizationId: ORGANIZATION_ID,
    currentState: {
      priority: 'MEDIUM',
      updatedAt: '2026-07-26T12:00:00.000Z',
    },
    supportedActionTypes: ['ESCALATE_BLOCKED_OVERDUE_TASK_PRIORITY'],
  });

  assert.equal(result.status, 'READY');
  assert.deepEqual(result.issues, []);
});

test('validateExecutionRequestReadiness returns STALE when priority drifted', () => {
  const result = validateExecutionRequestReadiness({
    request: requestFixture(),
    organizationId: ORGANIZATION_ID,
    currentState: {
      priority: 'HIGH',
      updatedAt: '2026-07-26T12:00:00.000Z',
    },
    supportedActionTypes: ['ESCALATE_BLOCKED_OVERDUE_TASK_PRIORITY'],
  });

  assert.equal(result.status, 'STALE');
  assert.ok(result.issues.length > 0);
});

test('validateExecutionRequestReadiness returns UNSUPPORTED for unsupported action type', () => {
  const result = validateExecutionRequestReadiness({
    request: requestFixture(),
    organizationId: ORGANIZATION_ID,
    currentState: {
      priority: 'MEDIUM',
      updatedAt: '2026-07-26T12:00:00.000Z',
    },
    supportedActionTypes: [],
  });

  assert.equal(result.status, 'UNSUPPORTED');
});

test('validateExecutionRequestReadiness requires confirmation when requested', () => {
  const result = validateExecutionRequestReadiness({
    request: requestFixture({ status: 'PENDING_CONFIRMATION' }),
    organizationId: ORGANIZATION_ID,
    currentState: {
      priority: 'MEDIUM',
      updatedAt: '2026-07-26T12:00:00.000Z',
    },
    supportedActionTypes: ['ESCALATE_BLOCKED_OVERDUE_TASK_PRIORITY'],
    requireConfirmed: true,
  });

  assert.equal(result.status, 'UNSUPPORTED');
  assert.match(result.issues.join(' '), /confirmation/i);
});
