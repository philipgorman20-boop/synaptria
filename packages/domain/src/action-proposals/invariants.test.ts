import assert from 'node:assert/strict';
import test from 'node:test';

import { organizationId } from '@synaptria/core';
import type { ActionProposal } from '@synaptria/domain/action-proposals';
import {
  isActionProposalScalarValue,
  isValidActionProposal,
  validateActionProposalInvariants,
  validateActionProposalPreconditions,
} from '@synaptria/domain/action-proposals';

const ORGANIZATION_ID = organizationId('org-1');

function baseProposal(
  overrides: Partial<ActionProposal> = {},
): ActionProposal {
  return {
    id: 'ap:rec-1',
    organizationId: ORGANIZATION_ID,
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
    ...overrides,
  };
}

const mutableFields = new Set(['status', 'priority', 'plannedEndDate']);
const preconditionFields = new Set(['status', 'priority', 'plannedEndDate', 'updatedAt']);

test('advisory proposals require zero changes and preconditions', () => {
  const issues = validateActionProposalInvariants(baseProposal());
  assert.deepEqual(issues, []);
  assert.equal(isValidActionProposal(baseProposal()), true);
});

test('advisory proposals reject proposedChanges and preconditions', () => {
  const withChanges = baseProposal({
    proposedChanges: [
      { field: 'status', currentValue: 'BLOCKED', proposedValue: 'IN_PROGRESS' },
    ],
  });
  const withPreconditions = baseProposal({
    preconditions: [{ field: 'status', expectedValue: 'BLOCKED' }],
  });

  assert.match(
    validateActionProposalInvariants(withChanges).join('\n'),
    /Advisory proposals must not include proposedChanges/,
  );
  assert.match(
    validateActionProposalInvariants(withPreconditions).join('\n'),
    /Advisory proposals must not include preconditions/,
  );
});

test('operational proposals require changes, preconditions, and matching current values', () => {
  const validProposal = baseProposal({
    proposalKind: 'OPERATIONAL',
    title: 'Operational change: Unblock task',
    proposedChanges: [
      { field: 'status', currentValue: 'BLOCKED', proposedValue: 'IN_PROGRESS' },
    ],
    preconditions: [
      { field: 'status', expectedValue: 'BLOCKED' },
      { field: 'updatedAt', expectedValue: '2026-07-26T12:00:00.000Z' },
    ],
  });

  assert.equal(
    isValidActionProposal(validProposal, { mutableFields, preconditionFields }),
    true,
  );

  const mismatchedCurrent = baseProposal({
    proposalKind: 'OPERATIONAL',
    proposedChanges: [
      { field: 'status', currentValue: 'TODO', proposedValue: 'IN_PROGRESS' },
    ],
    preconditions: [{ field: 'status', expectedValue: 'BLOCKED' }],
  });

  assert.match(
    validateActionProposalInvariants(mismatchedCurrent, { mutableFields, preconditionFields }).join('\n'),
    /currentValue must match its precondition expectedValue/,
  );

  const unchangedValue = baseProposal({
    proposalKind: 'OPERATIONAL',
    proposedChanges: [
      { field: 'status', currentValue: 'BLOCKED', proposedValue: 'BLOCKED' },
    ],
    preconditions: [{ field: 'status', expectedValue: 'BLOCKED' }],
  });

  assert.match(
    validateActionProposalInvariants(unchangedValue, { mutableFields, preconditionFields }).join('\n'),
    /must differ between currentValue and proposedValue/,
  );
});

test('operational proposals reject duplicate and non-allowlisted fields', () => {
  const duplicateField = baseProposal({
    proposalKind: 'OPERATIONAL',
    proposedChanges: [
      { field: 'status', currentValue: 'BLOCKED', proposedValue: 'IN_PROGRESS' },
      { field: 'status', currentValue: 'BLOCKED', proposedValue: 'TODO' },
    ],
    preconditions: [{ field: 'status', expectedValue: 'BLOCKED' }],
  });

  assert.match(
    validateActionProposalInvariants(duplicateField, { mutableFields, preconditionFields }).join('\n'),
    /Duplicate proposed change field "status"/,
  );

  const nonAllowlisted = baseProposal({
    proposalKind: 'OPERATIONAL',
    proposedChanges: [
      { field: 'name', currentValue: 'Old', proposedValue: 'New' },
    ],
    preconditions: [{ field: 'name', expectedValue: 'Old' }],
  });

  assert.match(
    validateActionProposalInvariants(nonAllowlisted, { mutableFields, preconditionFields }).join('\n'),
    /not allowlisted/,
  );
});

test('operational proposals reject updatedAt as a proposed change but accept it as a precondition', () => {
  const updatedAtChange = baseProposal({
    proposalKind: 'OPERATIONAL',
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

  assert.match(
    validateActionProposalInvariants(updatedAtChange, { mutableFields, preconditionFields }).join('\n'),
    /Proposed change field "updatedAt" is not allowlisted/,
  );

  const businessChangeWithUpdatedAtPrecondition = baseProposal({
    proposalKind: 'OPERATIONAL',
    proposedChanges: [
      { field: 'status', currentValue: 'BLOCKED', proposedValue: 'IN_PROGRESS' },
    ],
    preconditions: [
      { field: 'status', expectedValue: 'BLOCKED' },
      { field: 'updatedAt', expectedValue: '2026-07-26T12:00:00.000Z' },
    ],
  });

  assert.equal(
    isValidActionProposal(businessChangeWithUpdatedAtPrecondition, {
      mutableFields,
      preconditionFields,
    }),
    true,
  );
});

test('scalar safety accepts bounded JSON-safe values only', () => {
  assert.equal(isActionProposalScalarValue('BLOCKED'), true);
  assert.equal(isActionProposalScalarValue(null), true);
  assert.equal(isActionProposalScalarValue({ status: 'BLOCKED' }), false);
  assert.equal(isActionProposalScalarValue(['BLOCKED']), false);
});

test('precondition validation classifies advisory proposals as not applicable', () => {
  const result = validateActionProposalPreconditions(baseProposal(), {
    status: 'BLOCKED',
  });

  assert.deepEqual(result, {
    status: 'NOT_APPLICABLE',
    issues: [],
  });
});

test('precondition validation classifies matching state as current and drift as stale', () => {
  const proposal = baseProposal({
    proposalKind: 'OPERATIONAL',
    proposedChanges: [
      { field: 'status', currentValue: 'BLOCKED', proposedValue: 'IN_PROGRESS' },
    ],
    preconditions: [{ field: 'status', expectedValue: 'BLOCKED' }],
  });

  assert.deepEqual(
    validateActionProposalPreconditions(proposal, { status: 'BLOCKED' }),
    { status: 'CURRENT', issues: [] },
  );

  const stale = validateActionProposalPreconditions(proposal, { status: 'IN_PROGRESS' });
  assert.equal(stale.status, 'STALE');
  assert.deepEqual(stale.issues, [
    'Field "status" no longer matches the expected precondition value.',
  ]);
});

test('precondition issue ordering is deterministic', () => {
  const proposal = baseProposal({
    proposalKind: 'OPERATIONAL',
    proposedChanges: [
      { field: 'status', currentValue: 'BLOCKED', proposedValue: 'IN_PROGRESS' },
      { field: 'priority', currentValue: 'HIGH', proposedValue: 'CRITICAL' },
    ],
    preconditions: [
      { field: 'status', expectedValue: 'BLOCKED' },
      { field: 'priority', expectedValue: 'HIGH' },
    ],
  });

  const result = validateActionProposalPreconditions(proposal, {
    status: 'IN_PROGRESS',
    priority: 'LOW',
  });

  assert.equal(result.status, 'STALE');
  assert.deepEqual(result.issues, [
    'Field "priority" no longer matches the expected precondition value.',
    'Field "status" no longer matches the expected precondition value.',
  ]);
});
