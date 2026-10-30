import type {
  CreateFundingEventContext,
  DeleteFundingEventContext,
  ListFundingEventsContext,
  UpdateFundingEventContext,
} from '@synaptria/application';
import type { ResolvedOrganizationContext } from '@synaptria/auth';

export function toCreateFundingEventContext(context: ResolvedOrganizationContext): CreateFundingEventContext {
  return {
    organizationId: context.organizationId,
    userId: context.userId,
    membershipId: context.membershipId,
    role: context.role,
    requestId: context.requestId,
    correlationId: context.correlationId,
  };
}

export function toUpdateFundingEventContext(context: ResolvedOrganizationContext): UpdateFundingEventContext {
  return {
    organizationId: context.organizationId,
    userId: context.userId,
    membershipId: context.membershipId,
    role: context.role,
    requestId: context.requestId,
    correlationId: context.correlationId,
  };
}

export function toDeleteFundingEventContext(context: ResolvedOrganizationContext): DeleteFundingEventContext {
  return {
    organizationId: context.organizationId,
    userId: context.userId,
    membershipId: context.membershipId,
    role: context.role,
    requestId: context.requestId,
    correlationId: context.correlationId,
  };
}

export function toListFundingEventsContext(context: ResolvedOrganizationContext): ListFundingEventsContext {
  return {
    organizationId: context.organizationId,
    role: context.role,
  };
}
