import type {
  CreateVendorContext,
  DeleteVendorContext,
  GetVendorContext,
  ListVendorsContext,
  UpdateVendorContext,
} from '@synaptria/application';
import type { ResolvedOrganizationContext } from '@synaptria/auth';

export function toCreateVendorContext(context: ResolvedOrganizationContext): CreateVendorContext {
  return {
    organizationId: context.organizationId,
    userId: context.userId,
    membershipId: context.membershipId,
    role: context.role,
    requestId: context.requestId,
    correlationId: context.correlationId,
  };
}

export function toListVendorsContext(context: ResolvedOrganizationContext): ListVendorsContext {
  return {
    organizationId: context.organizationId,
    role: context.role,
  };
}

export function toGetVendorContext(context: ResolvedOrganizationContext): GetVendorContext {
  return {
    organizationId: context.organizationId,
    role: context.role,
  };
}

export function toUpdateVendorContext(context: ResolvedOrganizationContext): UpdateVendorContext {
  return {
    organizationId: context.organizationId,
    userId: context.userId,
    membershipId: context.membershipId,
    role: context.role,
    requestId: context.requestId,
    correlationId: context.correlationId,
  };
}

export function toDeleteVendorContext(context: ResolvedOrganizationContext): DeleteVendorContext {
  return {
    organizationId: context.organizationId,
    userId: context.userId,
    membershipId: context.membershipId,
    role: context.role,
    requestId: context.requestId,
    correlationId: context.correlationId,
  };
}
