import assert from 'node:assert/strict';
import test from 'node:test';

import { AuthorizationDeniedError } from '@synaptria/core/errors';

import {
  ALL_PERMISSIONS,
  PERMISSIONS,
  hasAllPermissions,
  hasAnyPermission,
  hasPermission,
  permissionsForRole,
  requireAllPermissions,
  requireAnyPermission,
  requirePermission,
} from './index';

test('owner receives every defined permission', () => {
  assert.deepEqual(permissionsForRole('OWNER'), ALL_PERMISSIONS);
});

test('admin cannot transfer ownership or delete the organization', () => {
  assert.equal(hasPermission('ADMIN', PERMISSIONS.ORGANIZATION_UPDATE), true);
  assert.equal(hasPermission('ADMIN', PERMISSIONS.ORGANIZATION_TRANSFER_OWNERSHIP), false);
  assert.equal(hasPermission('ADMIN', PERMISSIONS.ORGANIZATION_DELETE), false);
});

test('member can manage operational work but not finance or membership', () => {
  assert.equal(hasPermission('MEMBER', PERMISSIONS.PROGRAMS_MANAGE), true);
  assert.equal(hasPermission('MEMBER', PERMISSIONS.PROJECTS_MANAGE), true);
  assert.equal(hasPermission('MEMBER', PERMISSIONS.DOCUMENTS_UPLOAD), true);
  assert.equal(hasPermission('MEMBER', PERMISSIONS.FINANCE_READ), false);
  assert.equal(hasPermission('MEMBER', PERMISSIONS.ORGANIZATION_MANAGE_MEMBERS), false);
});

test('viewer receives read-only access', () => {
  assert.equal(hasPermission('VIEWER', PERMISSIONS.DASHBOARD_READ), true);
  assert.equal(hasPermission('VIEWER', PERMISSIONS.PROGRAMS_READ), true);
  assert.equal(hasPermission('VIEWER', PERMISSIONS.PROJECTS_READ), true);
  assert.equal(hasPermission('VIEWER', PERMISSIONS.PROGRAMS_MANAGE), false);
  assert.equal(hasPermission('VIEWER', PERMISSIONS.PROJECTS_MANAGE), false);
  assert.equal(hasPermission('VIEWER', PERMISSIONS.DOCUMENTS_UPLOAD), false);
});

test('projects permissions mirror programs role assignments', () => {
  assert.equal(hasPermission('OWNER', PERMISSIONS.PROJECTS_READ), true);
  assert.equal(hasPermission('OWNER', PERMISSIONS.PROJECTS_MANAGE), true);
  assert.equal(hasPermission('ADMIN', PERMISSIONS.PROJECTS_MANAGE), true);
  assert.equal(hasPermission('MEMBER', PERMISSIONS.PROJECTS_READ), true);
  assert.equal(hasPermission('MEMBER', PERMISSIONS.PROJECTS_MANAGE), true);
  assert.equal(hasPermission('VIEWER', PERMISSIONS.PROJECTS_READ), true);
  assert.equal(hasPermission('VIEWER', PERMISSIONS.PROJECTS_MANAGE), false);
});

test('any and all helpers evaluate permission collections', () => {
  assert.equal(
    hasAnyPermission('MEMBER', [PERMISSIONS.FINANCE_MANAGE, PERMISSIONS.PROGRAMS_MANAGE]),
    true,
  );
  assert.equal(
    hasAllPermissions('MEMBER', [PERMISSIONS.PROGRAMS_READ, PERMISSIONS.PROGRAMS_MANAGE]),
    true,
  );
  assert.equal(
    hasAllPermissions('MEMBER', [PERMISSIONS.PROGRAMS_READ, PERMISSIONS.FINANCE_READ]),
    false,
  );
});

test('requirePermission throws a typed authorization error', () => {
  assert.throws(
    () => requirePermission('VIEWER', PERMISSIONS.PROGRAMS_MANAGE),
    AuthorizationDeniedError,
  );
  assert.doesNotThrow(() => requirePermission('ADMIN', PERMISSIONS.PROGRAMS_MANAGE));
});

test('collection guards enforce any and all semantics', () => {
  assert.doesNotThrow(() =>
    requireAnyPermission('MEMBER', [PERMISSIONS.FINANCE_MANAGE, PERMISSIONS.PROGRAMS_MANAGE]),
  );
  assert.throws(
    () => requireAnyPermission('VIEWER', []),
    AuthorizationDeniedError,
  );
  assert.throws(
    () =>
      requireAllPermissions('MEMBER', [
        PERMISSIONS.PROGRAMS_MANAGE,
        PERMISSIONS.FINANCE_MANAGE,
      ]),
    AuthorizationDeniedError,
  );
});
