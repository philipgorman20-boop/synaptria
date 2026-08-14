import { createHash } from 'node:crypto';

import type { OrganizationId } from '@synaptria/core';
import {
  buildActionExecutionSnapshotCanonicalPayload,
  type ActionExecutionRequestSnapshot,
} from '@synaptria/domain/action-executions';

export function computeActionExecutionSnapshotFingerprint(
  organizationId: OrganizationId,
  snapshot: ActionExecutionRequestSnapshot,
): string {
  const canonical = buildActionExecutionSnapshotCanonicalPayload(organizationId, snapshot);
  return createHash('sha256').update(canonical, 'utf8').digest('hex');
}
