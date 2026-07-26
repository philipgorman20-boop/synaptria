import assert from 'node:assert/strict';
import test from 'node:test';

import {
  correlationId,
  membershipId,
  organizationId,
  programId,
  requestId,
  userId,
} from '@synaptria/core';

import {
  toCreateProjectContext,
  toGetProjectContext,
  toListProgramProjectsContext,
  toListProjectsContext,
} from './project-context';

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

test('toCreateProjectContext maps trusted request context without accepting client input', () => {
  assert.deepEqual(toCreateProjectContext(CONTEXT), {
    organizationId: CONTEXT.organizationId,
    userId: CONTEXT.userId,
    membershipId: CONTEXT.membershipId,
    role: CONTEXT.role,
    requestId: CONTEXT.requestId,
    correlationId: CONTEXT.correlationId,
  });
});

test('toListProjectsContext scopes reads to the authenticated organization', () => {
  assert.deepEqual(toListProjectsContext(CONTEXT), {
    organizationId: CONTEXT.organizationId,
    role: CONTEXT.role,
  });
});

test('toListProgramProjectsContext scopes reads to the authenticated organization', () => {
  assert.deepEqual(toListProgramProjectsContext(CONTEXT), {
    organizationId: CONTEXT.organizationId,
    role: CONTEXT.role,
  });
});

test('toGetProjectContext scopes reads to the authenticated organization', () => {
  assert.deepEqual(toGetProjectContext(CONTEXT), {
    organizationId: CONTEXT.organizationId,
    role: CONTEXT.role,
  });
});
