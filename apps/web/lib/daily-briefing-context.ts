import type { GetDailyBriefingSnapshotContext } from '@synaptria/application';
import type { ResolvedOrganizationContext } from '@synaptria/auth';

export function toDailyBriefingContext(
  context: ResolvedOrganizationContext,
): GetDailyBriefingSnapshotContext {
  return {
    organizationId: context.organizationId,
    role: context.role,
  };
}
