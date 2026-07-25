import type { OrganizationRole, TenantContext } from '@synaptria/core/context';

import type { Permission } from './permissions';
import { ROLE_PERMISSIONS } from './roles';

export function permissionsForRole(role: OrganizationRole): readonly Permission[] {
  return ROLE_PERMISSIONS[role];
}

export function permissionsForContext(context: TenantContext): readonly Permission[] {
  return permissionsForRole(context.role);
}

export function hasPermission(
  subject: OrganizationRole | TenantContext,
  permission: Permission,
): boolean {
  const role = typeof subject === 'string' ? subject : subject.role;
  return ROLE_PERMISSIONS[role].includes(permission);
}

export function hasAnyPermission(
  subject: OrganizationRole | TenantContext,
  permissions: readonly Permission[],
): boolean {
  return permissions.some((permission) => hasPermission(subject, permission));
}

export function hasAllPermissions(
  subject: OrganizationRole | TenantContext,
  permissions: readonly Permission[],
): boolean {
  return permissions.every((permission) => hasPermission(subject, permission));
}
