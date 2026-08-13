import type { OrganizationRole } from '@synaptria/core/context';
import { hasPermission, PERMISSIONS } from '@synaptria/permissions';

export interface RecommendationReviewAccessPolicy {
  canReadRecommendationReview(role: OrganizationRole): boolean;
  canReviewRecommendations(role: OrganizationRole): boolean;
}

export function createDefaultRecommendationReviewAccessPolicy(): RecommendationReviewAccessPolicy {
  return {
    canReadRecommendationReview(role) {
      return hasPermission(role, PERMISSIONS.DASHBOARD_READ);
    },
    canReviewRecommendations(role) {
      return hasPermission(role, PERMISSIONS.AI_REVIEW);
    },
  };
}
