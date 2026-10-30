import type { AssembleContextContext } from '@synaptria/application';
import type { ResolvedOrganizationContext } from '@synaptria/auth';

export function toAssembleContextContext(
  context: ResolvedOrganizationContext,
): AssembleContextContext {
  return {
    userId: context.userId,
    organizationId: context.organizationId,
    membershipId: context.membershipId,
    role: context.role,
    requestId: context.requestId,
    correlationId: context.correlationId,
  };
}
