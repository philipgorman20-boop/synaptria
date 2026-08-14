import type { OrganizationId } from '@synaptria/core';
import type {
  ActionProposal,
  ActionProposalPreconditionValidation,
} from '@synaptria/domain/action-proposals';
import type { EntityReference } from '@synaptria/domain/context';

import type { DailyBriefingCompleteness } from '../daily-briefing/types';
import type { MissionControlRestrictedSlice } from '../mission-control/constants';
import type { RecommendationEvidenceItem } from '../recommendations/types';

export interface ActionProposalsSnapshotMetadata {
  readonly deterministic: true;
  readonly restrictedSlices: readonly MissionControlRestrictedSlice[];
  readonly sourceSnapshotGeneratedAt: Date;
}

export interface ActionProposalSourceContext {
  readonly recommendationId: string;
  readonly targetEntity: EntityReference;
  readonly evidence: readonly RecommendationEvidenceItem[];
}

export interface ActionProposalListItem {
  readonly proposal: ActionProposal;
  readonly source: ActionProposalSourceContext;
  readonly validation: ActionProposalPreconditionValidation;
}

export interface ActionProposalsSnapshot {
  readonly generatedAt: Date;
  readonly organization: {
    readonly organizationId: OrganizationId;
  };
  readonly proposals: readonly ActionProposalListItem[];
  readonly completeness: DailyBriefingCompleteness;
  readonly metadata: ActionProposalsSnapshotMetadata;
}

export interface UnsupportedActionProposalResult {
  readonly kind: 'unsupported';
  readonly recommendationId: string;
  readonly reason: string;
}

export type ActionProposalLookupResult = ActionProposal | UnsupportedActionProposalResult;
