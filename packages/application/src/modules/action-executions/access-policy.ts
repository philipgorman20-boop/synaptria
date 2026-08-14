import type { OrganizationRole } from '@synaptria/core/context';
import { PERMISSIONS, hasPermission } from '@synaptria/permissions';

export interface ActionExecutionAccessPolicy {
  readonly canCreateExecutionRequest: (role: OrganizationRole) => boolean;
  readonly canConfirmExecutionRequest: (role: OrganizationRole) => boolean;
}

export function createDefaultActionExecutionAccessPolicy(): ActionExecutionAccessPolicy {
  return {
    canCreateExecutionRequest(role) {
      return hasPermission(role, PERMISSIONS.ACTIONS_CONFIRM);
    },
    canConfirmExecutionRequest(role) {
      return hasPermission(role, PERMISSIONS.ACTIONS_CONFIRM);
    },
  };
}
