import type {
  GetRecommendationReviewSnapshotContext,
  ReviewRecommendationContext,
} from '@synaptria/application';
import type { ResolvedOrganizationContext } from '@synaptria/auth';

export function toRecommendationReviewReadContext(
  context: ResolvedOrganizationContext,
): GetRecommendationReviewSnapshotContext {
  return {
    organizationId: context.organizationId,
    role: context.role,
  };
}

export function toReviewRecommendationContext(
  context: ResolvedOrganizationContext,
): ReviewRecommendationContext {
  return {
    organizationId: context.organizationId,
    userId: context.userId,
    membershipId: context.membershipId,
    role: context.role,
    requestId: context.requestId,
    correlationId: context.correlationId,
  };
}
