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
  toCreateProgramContext,
  toGetProgramContext,
  toListProgramsContext,
} from './program-context';

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

test('toCreateProgramContext maps trusted request context without accepting client input', () => {
  assert.deepEqual(toCreateProgramContext(CONTEXT), {
    organizationId: CONTEXT.organizationId,
    userId: CONTEXT.userId,
    membershipId: CONTEXT.membershipId,
    role: CONTEXT.role,
    requestId: CONTEXT.requestId,
    correlationId: CONTEXT.correlationId,
  });
});

test('toListProgramsContext scopes reads to the authenticated organization', () => {
  assert.deepEqual(toListProgramsContext(CONTEXT), {
    organizationId: CONTEXT.organizationId,
    role: CONTEXT.role,
  });
});

test('toGetProgramContext scopes reads to the authenticated organization', () => {
  assert.deepEqual(toGetProgramContext(CONTEXT), {
    organizationId: CONTEXT.organizationId,
    role: CONTEXT.role,
  });
});
