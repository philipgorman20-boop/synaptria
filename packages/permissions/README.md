# @synaptria/permissions

Framework-independent role and permission policy for Synaptria.

## Rules

- Authorization is enforced on the server; UI checks are advisory only.
- Callers must pass a trusted `TenantContext` resolved from authentication and membership data.
- Application code checks permissions, not raw role names.
- Role mappings are immutable baseline policy. Resource ownership and record-level rules belong in application services.
- `OWNER` is the only role allowed to transfer ownership or delete an organization.

## Public API

- `Permission` and `PERMISSIONS`
- `ROLE_PERMISSIONS`
- `permissionsForRole`
- `hasPermission`, `hasAnyPermission`, and `hasAllPermissions`
- `requirePermission`, `requireAnyPermission`, and `requireAllPermissions`
