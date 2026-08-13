import type { EntityReference } from '@synaptria/domain/context';
import type { ContextAuthorization } from '@synaptria/domain/context';
import { PERMISSIONS, requirePermission } from '@synaptria/permissions';

export interface ContextAssemblyAuthorizer {
  authorizePrimaryEntityRead(
    authorization: ContextAuthorization,
    primaryEntity: EntityReference,
  ): void;
}

export function createDefaultContextAssemblyAuthorizer(): ContextAssemblyAuthorizer {
  return {
    authorizePrimaryEntityRead(authorization, primaryEntity) {
      switch (primaryEntity.entityType) {
        case 'Project':
          requirePermission(authorization.role, PERMISSIONS.PROJECTS_READ);
          return;
        case 'Milestone':
          requirePermission(authorization.role, PERMISSIONS.MILESTONES_READ);
          return;
        default:
          requirePermission(authorization.role, PERMISSIONS.ORGANIZATION_READ);
      }
    },
  };
}
