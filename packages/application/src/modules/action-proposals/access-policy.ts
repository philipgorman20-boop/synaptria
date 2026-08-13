import type { OrganizationRole } from '@synaptria/core/context';
import { hasPermission, PERMISSIONS } from '@synaptria/permissions';

export interface ActionProposalsAccessPolicy {
  canReadActionProposals(role: OrganizationRole): boolean;
}

export function createDefaultActionProposalsAccessPolicy(): ActionProposalsAccessPolicy {
  return {
    canReadActionProposals(role) {
      return hasPermission(role, PERMISSIONS.DASHBOARD_READ);
    },
  };
}
