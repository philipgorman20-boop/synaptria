import type {
  CreateTaskContext,
  GetTaskContext,
  ListMilestoneTasksContext,
  ListTasksContext,
} from '@synaptria/application';
import type { ResolvedOrganizationContext } from '@synaptria/auth';

export function toCreateTaskContext(
  context: ResolvedOrganizationContext,
): CreateTaskContext {
  return {
    organizationId: context.organizationId,
    userId: context.userId,
    membershipId: context.membershipId,
    role: context.role,
    requestId: context.requestId,
    correlationId: context.correlationId,
  };
}

export function toListTasksContext(
  context: ResolvedOrganizationContext,
): ListTasksContext {
  return {
    organizationId: context.organizationId,
    role: context.role,
  };
}

export function toListMilestoneTasksContext(
  context: ResolvedOrganizationContext,
): ListMilestoneTasksContext {
  return {
    organizationId: context.organizationId,
    role: context.role,
  };
}

export function toGetTaskContext(
  context: ResolvedOrganizationContext,
): GetTaskContext {
  return {
    organizationId: context.organizationId,
    role: context.role,
  };
}
