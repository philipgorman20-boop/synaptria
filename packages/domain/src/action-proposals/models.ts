import type { OrganizationId } from '@synaptria/core';
import type { EntityType } from '@synaptria/domain/context';

export const ACTION_PROPOSAL_STATUSES = ['PROPOSED'] as const;

export type ActionProposalStatus = (typeof ACTION_PROPOSAL_STATUSES)[number];

export const ACTION_PROPOSAL_KINDS = ['ADVISORY', 'OPERATIONAL'] as const;

export type ActionProposalKind = (typeof ACTION_PROPOSAL_KINDS)[number];

export type ActionProposalScalarValue = string | number | boolean | null;

export interface ActionProposalChange {
  readonly field: string;
  readonly currentValue: ActionProposalScalarValue;
  readonly proposedValue: ActionProposalScalarValue;
}

export interface ActionProposalPrecondition {
  readonly field: string;
  readonly expectedValue: ActionProposalScalarValue;
}

export interface ActionProposalTarget {
  readonly entityType: EntityType;
  readonly entityId: string;
}

export interface ActionProposal {
  readonly id: string;
  readonly organizationId: OrganizationId;
  readonly recommendationId: string;
  readonly recommendationType: string;
  readonly actionType: string;
  readonly proposalKind: ActionProposalKind;
  readonly target: ActionProposalTarget;
  readonly title: string;
  readonly description: string;
  /** Genuine operational before/after field mutations validated against authoritative state. */
  readonly proposedChanges: readonly ActionProposalChange[];
  /** Expected authoritative field values at proposal generation time. */
  readonly preconditions: readonly ActionProposalPrecondition[];
  readonly evidenceKeys: readonly string[];
  readonly status: ActionProposalStatus;
  readonly createdAt: Date;
}

export const ACTION_PROPOSAL_PRECONDITION_VALIDATION_STATUSES = [
  'CURRENT',
  'STALE',
  'NOT_APPLICABLE',
] as const;

export type ActionProposalPreconditionValidationStatus =
  (typeof ACTION_PROPOSAL_PRECONDITION_VALIDATION_STATUSES)[number];

export interface ActionProposalPreconditionValidation {
  readonly status: ActionProposalPreconditionValidationStatus;
  readonly issues: readonly string[];
}
