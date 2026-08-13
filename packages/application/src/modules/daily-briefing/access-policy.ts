import type { OrganizationRole } from '@synaptria/core/context';
import { hasPermission, PERMISSIONS } from '@synaptria/permissions';

export interface DailyBriefingAccessPolicy {
  canAccessDailyBriefing(role: OrganizationRole): boolean;
}

export function createDefaultDailyBriefingAccessPolicy(): DailyBriefingAccessPolicy {
  return {
    canAccessDailyBriefing(role) {
      return hasPermission(role, PERMISSIONS.DASHBOARD_READ);
    },
  };
}
