import type { GetMissionControlSnapshotContext } from '@synaptria/application';
import type { ResolvedOrganizationContext } from '@synaptria/auth';

export function toMissionControlContext(
  context: ResolvedOrganizationContext,
): GetMissionControlSnapshotContext {
  return {
    organizationId: context.organizationId,
    role: context.role,
  };
}
