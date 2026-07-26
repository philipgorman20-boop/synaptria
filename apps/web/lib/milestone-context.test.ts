import assert from 'node:assert/strict';
import test from 'node:test';

import {
  correlationId,
  membershipId,
  organizationId,
  requestId,
  userId,
} from '@synaptria/core';

import {
  toCreateMilestoneContext,
  toGetMilestoneContext,
  toListMilestonesContext,
  toListProjectMilestonesContext,
} from './milestone-context';

const CONTEXT = {
  userId: userId('user-1'),
  organizationId: organizationId('org-1'),
  membershipId: membershipId('membership-1'),
  role: 'MEMBER' as const,
  requestId: requestId('request-1'),
  correlationId: correlationId('correlation-1'),
  organizationName: 'Synaptria Labs',
  organizationSlug: 'synaptria-labs',
};

test('toCreateMilestoneContext maps trusted request context without accepting client input', () => {
  assert.deepEqual(toCreateMilestoneContext(CONTEXT), {
    organizationId: CONTEXT.organizationId,
    userId: CONTEXT.userId,
    membershipId: CONTEXT.membershipId,
    role: CONTEXT.role,
    requestId: CONTEXT.requestId,
    correlationId: CONTEXT.correlationId,
  });
});

test('toListMilestonesContext scopes reads to the authenticated organization', () => {
  assert.deepEqual(toListMilestonesContext(CONTEXT), {
    organizationId: CONTEXT.organizationId,
    role: CONTEXT.role,
  });
});

test('toListProjectMilestonesContext scopes reads to the authenticated organization', () => {
  assert.deepEqual(toListProjectMilestonesContext(CONTEXT), {
    organizationId: CONTEXT.organizationId,
    role: CONTEXT.role,
  });
});

test('toGetMilestoneContext scopes reads to the authenticated organization', () => {
  assert.deepEqual(toGetMilestoneContext(CONTEXT), {
    organizationId: CONTEXT.organizationId,
    role: CONTEXT.role,
  });
});
