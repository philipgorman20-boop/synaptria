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
  toCreateTaskContext,
  toGetTaskContext,
  toListMilestoneTasksContext,
  toListTasksContext,
} from './task-context';

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

test('toCreateTaskContext maps trusted request context without accepting client input', () => {
  assert.deepEqual(toCreateTaskContext(CONTEXT), {
    organizationId: CONTEXT.organizationId,
    userId: CONTEXT.userId,
    membershipId: CONTEXT.membershipId,
    role: CONTEXT.role,
    requestId: CONTEXT.requestId,
    correlationId: CONTEXT.correlationId,
  });
});

test('toListTasksContext scopes reads to the authenticated organization', () => {
  assert.deepEqual(toListTasksContext(CONTEXT), {
    organizationId: CONTEXT.organizationId,
    role: CONTEXT.role,
  });
});

test('toListMilestoneTasksContext scopes reads to the authenticated organization', () => {
  assert.deepEqual(toListMilestoneTasksContext(CONTEXT), {
    organizationId: CONTEXT.organizationId,
    role: CONTEXT.role,
  });
});

test('toGetTaskContext scopes reads to the authenticated organization', () => {
  assert.deepEqual(toGetTaskContext(CONTEXT), {
    organizationId: CONTEXT.organizationId,
    role: CONTEXT.role,
  });
});
