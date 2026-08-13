import assert from 'node:assert/strict';
import test from 'node:test';

import {
  organizationId,
  userId,
  identifier,
  correlationId,
  requestId,
} from '@synaptria/core';

import {
  toRecommendationReviewReadContext,
  toReviewRecommendationContext,
} from './recommendation-review-context';

test('recommendation review context mappers use trusted request context only', () => {
  const resolved = {
    userId: userId('user-1'),
    organizationId: organizationId('org-1'),
    membershipId: identifier('membership-1', 'MembershipId'),
    role: 'MEMBER' as const,
    requestId: requestId('request-1'),
    correlationId: correlationId('correlation-1'),
    organizationName: 'Synaptria Labs',
    organizationSlug: 'synaptria-labs',
  };

  assert.deepEqual(toRecommendationReviewReadContext(resolved), {
    organizationId: resolved.organizationId,
    role: resolved.role,
  });

  assert.deepEqual(toReviewRecommendationContext(resolved), {
    organizationId: resolved.organizationId,
    userId: resolved.userId,
    membershipId: resolved.membershipId,
    role: resolved.role,
    requestId: resolved.requestId,
    correlationId: resolved.correlationId,
  });
});
