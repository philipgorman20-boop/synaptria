import type { OrganizationRole } from '@synaptria/core/context';
import { hasPermission, PERMISSIONS } from '@synaptria/permissions';

export interface RecommendationsAccessPolicy {
  canAccessRecommendations(role: OrganizationRole): boolean;
}

export function createDefaultRecommendationsAccessPolicy(): RecommendationsAccessPolicy {
  return {
    canAccessRecommendations(role) {
      return hasPermission(role, PERMISSIONS.DASHBOARD_READ);
    },
  };
}
