import type {
  CreateMilestoneContext,
  GetMilestoneContext,
  ListMilestonesContext,
  ListProjectMilestonesContext,
} from '@synaptria/application';
import type { ResolvedOrganizationContext } from '@synaptria/auth';

export function toCreateMilestoneContext(
  context: ResolvedOrganizationContext,
): CreateMilestoneContext {
  return {
    organizationId: context.organizationId,
    userId: context.userId,
    membershipId: context.membershipId,
    role: context.role,
    requestId: context.requestId,
    correlationId: context.correlationId,
  };
}

export function toListMilestonesContext(
  context: ResolvedOrganizationContext,
): ListMilestonesContext {
  return {
    organizationId: context.organizationId,
    role: context.role,
  };
}

export function toListProjectMilestonesContext(
  context: ResolvedOrganizationContext,
): ListProjectMilestonesContext {
  return {
    organizationId: context.organizationId,
    role: context.role,
  };
}

export function toGetMilestoneContext(
  context: ResolvedOrganizationContext,
): GetMilestoneContext {
  return {
    organizationId: context.organizationId,
    role: context.role,
  };
}
