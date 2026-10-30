import assert from 'node:assert/strict';
import test from 'node:test';

import { correlationId, requestId } from '@synaptria/core';

import {
  buildOrganizationContext,
  OrganizationMembershipRequiredError,
  selectOrganizationMembership,
  type OrganizationMembershipCandidate,
} from './organization-context';

const memberships: readonly OrganizationMembershipCandidate[] = [
  {
    id: 'membership-1',
    userId: 'user-1',
    organizationId: 'organization-1',
    role: 'OWNER',
    organization: { name: 'First Biotech', slug: 'first-biotech' },
  },
  {
    id: 'membership-2',
    userId: 'user-1',
    organizationId: 'organization-2',
    role: 'MEMBER',
    organization: { name: 'Second Biotech', slug: 'second-biotech' },
  },
];

test('selectOrganizationMembership honors an accessible preferred organization', () => {
  const selected = selectOrganizationMembership(memberships, 'organization-2');

  assert.equal(selected.id, 'membership-2');
});

test('selectOrganizationMembership ignores an inaccessible preferred organization', () => {
  const selected = selectOrganizationMembership(memberships, 'organization-not-accessible');

  assert.equal(selected.id, 'membership-1');
});

test('selectOrganizationMembership rejects users without active memberships', () => {
  assert.throws(
    () => selectOrganizationMembership([]),
    OrganizationMembershipRequiredError,
  );
});

test('buildOrganizationContext creates branded tenant and request context', () => {
  const context = buildOrganizationContext({
    membership: memberships[0]!,
    requestId: requestId('request-1'),
    correlationId: correlationId('correlation-1'),
  });

  assert.equal(context.userId, 'user-1');
  assert.equal(context.organizationId, 'organization-1');
  assert.equal(context.membershipId, 'membership-1');
  assert.equal(context.role, 'OWNER');
  assert.equal(context.organizationName, 'First Biotech');
});
