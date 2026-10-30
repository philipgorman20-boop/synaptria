import type {
  CreateDecisionContext,
  DeleteDecisionContext,
  GetDecisionContext,
  ListDecisionsContext,
  UpdateDecisionContext,
} from '@synaptria/application';
import type { ResolvedOrganizationContext } from '@synaptria/auth';

export function toCreateDecisionContext(context: ResolvedOrganizationContext): CreateDecisionContext {
  return {
    organizationId: context.organizationId,
    userId: context.userId,
    membershipId: context.membershipId,
    role: context.role,
    requestId: context.requestId,
    correlationId: context.correlationId,
  };
}

export function toListDecisionsContext(context: ResolvedOrganizationContext): ListDecisionsContext {
  return {
    organizationId: context.organizationId,
    role: context.role,
  };
}

export function toGetDecisionContext(context: ResolvedOrganizationContext): GetDecisionContext {
  return {
    organizationId: context.organizationId,
    role: context.role,
  };
}

export function toUpdateDecisionContext(context: ResolvedOrganizationContext): UpdateDecisionContext {
  return {
    organizationId: context.organizationId,
    userId: context.userId,
    membershipId: context.membershipId,
    role: context.role,
    requestId: context.requestId,
    correlationId: context.correlationId,
  };
}

export function toDeleteDecisionContext(context: ResolvedOrganizationContext): DeleteDecisionContext {
  return {
    organizationId: context.organizationId,
    userId: context.userId,
    membershipId: context.membershipId,
    role: context.role,
    requestId: context.requestId,
    correlationId: context.correlationId,
  };
}
