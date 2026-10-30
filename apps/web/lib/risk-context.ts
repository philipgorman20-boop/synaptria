import type {
  CreateRiskContext,
  DeleteRiskContext,
  GetRiskContext,
  ListRisksContext,
  UpdateRiskContext,
} from '@synaptria/application';
import type { ResolvedOrganizationContext } from '@synaptria/auth';

export function toCreateRiskContext(context: ResolvedOrganizationContext): CreateRiskContext {
  return {
    organizationId: context.organizationId,
    userId: context.userId,
    membershipId: context.membershipId,
    role: context.role,
    requestId: context.requestId,
    correlationId: context.correlationId,
  };
}

export function toListRisksContext(context: ResolvedOrganizationContext): ListRisksContext {
  return {
    organizationId: context.organizationId,
    role: context.role,
  };
}

export function toGetRiskContext(context: ResolvedOrganizationContext): GetRiskContext {
  return {
    organizationId: context.organizationId,
    role: context.role,
  };
}

export function toUpdateRiskContext(context: ResolvedOrganizationContext): UpdateRiskContext {
  return {
    organizationId: context.organizationId,
    userId: context.userId,
    membershipId: context.membershipId,
    role: context.role,
    requestId: context.requestId,
    correlationId: context.correlationId,
  };
}

export function toDeleteRiskContext(context: ResolvedOrganizationContext): DeleteRiskContext {
  return {
    organizationId: context.organizationId,
    userId: context.userId,
    membershipId: context.membershipId,
    role: context.role,
    requestId: context.requestId,
    correlationId: context.correlationId,
  };
}
