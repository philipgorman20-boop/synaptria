import type { GetActionProposalsContext } from '@synaptria/application';
import type { ResolvedOrganizationContext } from '@synaptria/auth';

export function toActionProposalsReadContext(
  context: ResolvedOrganizationContext,
): GetActionProposalsContext {
  return {
    organizationId: context.organizationId,
    role: context.role,
  };
}
