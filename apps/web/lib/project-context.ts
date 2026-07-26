import type {
  CreateProjectContext,
  GetProjectContext,
  ListProgramProjectsContext,
  ListProjectsContext,
} from '@synaptria/application';
import type { ResolvedOrganizationContext } from '@synaptria/auth';

export function toCreateProjectContext(
  context: ResolvedOrganizationContext,
): CreateProjectContext {
  return {
    organizationId: context.organizationId,
    userId: context.userId,
    membershipId: context.membershipId,
    role: context.role,
    requestId: context.requestId,
    correlationId: context.correlationId,
  };
}

export function toListProjectsContext(
  context: ResolvedOrganizationContext,
): ListProjectsContext {
  return {
    organizationId: context.organizationId,
    role: context.role,
  };
}

export function toListProgramProjectsContext(
  context: ResolvedOrganizationContext,
): ListProgramProjectsContext {
  return {
    organizationId: context.organizationId,
    role: context.role,
  };
}

export function toGetProjectContext(
  context: ResolvedOrganizationContext,
): GetProjectContext {
  return {
    organizationId: context.organizationId,
    role: context.role,
  };
}
