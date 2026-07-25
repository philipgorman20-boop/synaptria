import type { OrganizationRole, TenantContext } from '@synaptria/core/context';
import { AuthorizationDeniedError } from '@synaptria/core/errors';

import type { Permission } from './permissions';
import { hasAllPermissions, hasAnyPermission, hasPermission } from './resolver';

type PermissionSubject = OrganizationRole | TenantContext;

function permissionList(permissions: readonly Permission[]): string {
  return permissions.join(', ');
}

export function requirePermission(
  subject: PermissionSubject,
  permission: Permission,
): void {
  if (!hasPermission(subject, permission)) {
    throw new AuthorizationDeniedError(`Missing required permission: ${permission}.`);
  }
}

export function requireAnyPermission(
  subject: PermissionSubject,
  permissions: readonly Permission[],
): void {
  if (permissions.length === 0 || !hasAnyPermission(subject, permissions)) {
    throw new AuthorizationDeniedError(
      `At least one of these permissions is required: ${permissionList(permissions)}.`,
    );
  }
}

export function requireAllPermissions(
  subject: PermissionSubject,
  permissions: readonly Permission[],
): void {
  if (!hasAllPermissions(subject, permissions)) {
    throw new AuthorizationDeniedError(
      `All of these permissions are required: ${permissionList(permissions)}.`,
    );
  }
}
