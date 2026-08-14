import type { OrganizationId } from '@synaptria/core';
import type { ActionProposalScalarValue } from '@synaptria/domain/action-proposals';

import type { ActionExecutionRequestSnapshot } from './models';

function encodeScalar(value: ActionProposalScalarValue): string {
  return JSON.stringify(value);
}

function compareByField(
  left: { readonly field: string },
  right: { readonly field: string },
): number {
  return left.field.localeCompare(right.field, 'en', { sensitivity: 'base' });
}

/** Canonical deterministic payload used to fingerprint immutable execution snapshots. */
export function buildActionExecutionSnapshotCanonicalPayload(
  organizationId: OrganizationId,
  snapshot: ActionExecutionRequestSnapshot,
): string {
  const lines: string[] = [
    `organizationId=${organizationId}`,
    `actionProposalId=${snapshot.actionProposalId}`,
    `recommendationId=${snapshot.recommendationId}`,
    `actionType=${snapshot.actionType}`,
    `targetEntityType=${snapshot.target.entityType}`,
    `targetEntityId=${snapshot.target.entityId}`,
  ];

  for (const change of [...snapshot.proposedChanges].sort(compareByField)) {
    lines.push(
      `change:${change.field}:${encodeScalar(change.currentValue)}:${encodeScalar(change.proposedValue)}`,
    );
  }

  for (const precondition of [...snapshot.preconditions].sort(compareByField)) {
    lines.push(
      `precondition:${precondition.field}:${encodeScalar(precondition.expectedValue)}`,
    );
  }

  return lines.join('\n');
}
