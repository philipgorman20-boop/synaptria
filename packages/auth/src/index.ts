import type { Role, TenantContext } from "@synaptria/types";

export const roles = [
  "OWNER",
  "ADMIN",
  "MEMBER",
  "VIEWER",
] as const satisfies readonly Role[];

export const roleRank: Readonly<Record<Role, number>> = {
  VIEWER: 0,
  MEMBER: 1,
  ADMIN: 2,
  OWNER: 3,
};

export class AuthorizationError extends Error {
  constructor(message = "You are not authorized to perform this action.") {
    super(message);
    this.name = "AuthorizationError";
  }
}

export function hasMinimumRole(currentRole: Role, requiredRole: Role): boolean {
  return roleRank[currentRole] >= roleRank[requiredRole];
}

export function requireMinimumRole(
  context: TenantContext,
  requiredRole: Role,
): TenantContext {
  if (!hasMinimumRole(context.role, requiredRole)) {
    throw new AuthorizationError(
      `Role ${context.role} does not satisfy the required role ${requiredRole}.`,
    );
  }

  return context;
}

export function canManageOrganization(role: Role): boolean {
  return hasMinimumRole(role, "ADMIN");
}

export function canManageMembers(role: Role): boolean {
  return hasMinimumRole(role, "ADMIN");
}

export function canManageBilling(role: Role): boolean {
  return role === "OWNER";
}

export function canWriteWorkspaceData(role: Role): boolean {
  return hasMinimumRole(role, "MEMBER");
}

export function canViewWorkspace(role: Role): boolean {
  return hasMinimumRole(role, "VIEWER");
}
