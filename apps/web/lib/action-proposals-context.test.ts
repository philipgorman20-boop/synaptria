import assert from 'node:assert/strict';
import test from 'node:test';

import {
  correlationId,
  organizationId,
  requestId,
  userId,
  identifier,
} from '@synaptria/core';

import { toActionProposalsReadContext } from './action-proposals-context';

test('action proposals read context uses trusted organization context only', () => {
  const resolved = {
    userId: userId('user-1'),
    organizationId: organizationId('org-1'),
    membershipId: identifier('membership-1', 'MembershipId'),
    role: 'VIEWER' as const,
    requestId: requestId('request-1'),
    correlationId: correlationId('correlation-1'),
    organizationName: 'Synaptria Labs',
    organizationSlug: 'synaptria-labs',
  };

  assert.deepEqual(toActionProposalsReadContext(resolved), {
    organizationId: resolved.organizationId,
    role: resolved.role,
  });
});
