import type { OrganizationId } from '@synaptria/core';
import type { EntityReference } from '@synaptria/domain/context';
import type { Priority } from '@synaptria/domain/shared';

import type { MissionControlRestrictedSlice, MissionControlSeverity } from '../mission-control/constants';
import type { MissionControlTaskSignal } from '../mission-control/types';
import type { DailyBriefingCompleteness, DailyBriefingEvidenceItem } from '../daily-briefing/types';
import type {
  RecommendationConfidence,
  RecommendationRuleId,
  RecommendationStatus,
  RecommendationType,
} from './constants';

export type RecommendationEvidenceItem = DailyBriefingEvidenceItem;

export interface RecommendationTaskPriorityMutation {
  readonly entityType: 'Task';
  readonly field: 'priority';
  readonly proposedValue: Priority;
}

export type RecommendationProposedMutation = RecommendationTaskPriorityMutation;

export interface RecommendationProposedAction {
  readonly description: string;
}

export interface RecommendationMetadata {
  readonly ruleId: RecommendationRuleId;
  readonly sourceSnapshotGeneratedAt: Date;
  readonly corroboratingSignalCount: number;
}

export interface Recommendation {
  readonly id: string;
  readonly type: RecommendationType;
  readonly ruleId: RecommendationRuleId;
  readonly title: string;
  readonly rationale: string;
  readonly priority: MissionControlSeverity;
  readonly targetEntity: EntityReference;
  readonly proposedAction: RecommendationProposedAction;
  readonly proposedMutation?: RecommendationProposedMutation;
  readonly evidence: readonly RecommendationEvidenceItem[];
  readonly confidence: RecommendationConfidence;
  readonly generatedAt: Date;
  readonly expiresAt?: Date;
  readonly status: RecommendationStatus;
  readonly metadata: RecommendationMetadata;
}

export interface RecommendationsSnapshotMetadata {
  readonly deterministic: true;
  readonly restrictedSlices: readonly MissionControlRestrictedSlice[];
  readonly sourceSnapshotGeneratedAt: Date;
}

export interface RecommendationsSnapshot {
  readonly generatedAt: Date;
  readonly organization: {
    readonly organizationId: OrganizationId;
  };
  readonly recommendations: readonly Recommendation[];
  readonly completeness: DailyBriefingCompleteness;
  readonly metadata: RecommendationsSnapshotMetadata;
}
