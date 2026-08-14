import type { OrganizationId, UserId } from '@synaptria/core';
import type {
  ActionProposalChange,
  ActionProposalPrecondition,
  ActionProposalTarget,
} from '@synaptria/domain/action-proposals';

export const ACTION_EXECUTION_REQUEST_STATUSES = [
  'PENDING_CONFIRMATION',
  'CONFIRMED',
] as const;

export type ActionExecutionRequestStatus =
  (typeof ACTION_EXECUTION_REQUEST_STATUSES)[number];

/** Immutable operational proposal snapshot captured at execution-request creation. */
export interface ActionExecutionRequestSnapshot {
  readonly actionProposalId: string;
  readonly recommendationId: string;
  readonly actionType: string;
  readonly target: ActionProposalTarget;
  readonly proposedChanges: readonly ActionProposalChange[];
  readonly preconditions: readonly ActionProposalPrecondition[];
}

export interface ActionExecutionRequest {
  readonly id: string;
  readonly organizationId: OrganizationId;
  readonly snapshot: ActionExecutionRequestSnapshot;
  readonly snapshotFingerprint: string;
  readonly requestedByUserId: UserId;
  readonly requestedAt: Date;
  readonly status: ActionExecutionRequestStatus;
  readonly createIdempotencyKey: string;
  readonly confirmedByUserId?: UserId;
  readonly confirmedAt?: Date;
  readonly confirmIdempotencyKey?: string;
}

export const ACTION_EXECUTION_READINESS_STATUSES = [
  'READY',
  'STALE',
  'UNSUPPORTED',
] as const;

export type ActionExecutionReadinessStatus =
  (typeof ACTION_EXECUTION_READINESS_STATUSES)[number];

export interface ActionExecutionReadinessResult {
  readonly status: ActionExecutionReadinessStatus;
  readonly issues: readonly string[];
}
