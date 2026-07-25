import type {
  CreateProgramContext,
  GetProgramContext,
  ListProgramsContext,
} from '@synaptria/application';
import type { ResolvedOrganizationContext } from '@synaptria/auth';

export function toCreateProgramContext(
  context: ResolvedOrganizationContext,
): CreateProgramContext {
  return {
    organizationId: context.organizationId,
    userId: context.userId,
    membershipId: context.membershipId,
    role: context.role,
    requestId: context.requestId,
    correlationId: context.correlationId,
  };
}

export function toListProgramsContext(
  context: ResolvedOrganizationContext,
): ListProgramsContext {
  return {
    organizationId: context.organizationId,
    role: context.role,
  };
}

export function toGetProgramContext(
  context: ResolvedOrganizationContext,
): GetProgramContext {
  return {
    organizationId: context.organizationId,
    role: context.role,
  };
}
