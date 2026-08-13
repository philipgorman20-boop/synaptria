import type { OrganizationId } from '@synaptria/core';
import type {
  EntityReference,
  EventEvidenceReference,
} from '@synaptria/domain/context';

import type {
  MissionControlAttentionItem,
  MissionControlRestrictedSlice,
} from '../mission-control/types';
import type {
  MissionControlProjectHealthState,
  MissionControlSeverity,
} from '../mission-control/constants';
import type {
  DailyBriefingCompletenessStatus,
  DailyBriefingEvidenceSource,
} from './constants';

export type DailyBriefingMetricValue = number | null;

export interface DailyBriefingWindow {
  readonly lookbackHours: number;
  readonly startsAt: Date;
  readonly endsAt: Date;
}

export interface DailyBriefingExecutiveSignals {
  readonly activeProjects: DailyBriefingMetricValue;
  readonly projectsAtRisk: DailyBriefingMetricValue;
  readonly overdueTasks: DailyBriefingMetricValue;
  readonly blockedTasks: DailyBriefingMetricValue;
  readonly overdueMilestones: DailyBriefingMetricValue;
  readonly dueSoonMilestones: DailyBriefingMetricValue;
  readonly dueSoonTasks: DailyBriefingMetricValue;
  readonly recentOrganizationEvents: DailyBriefingMetricValue;
  readonly changedProjectCount: DailyBriefingMetricValue;
}

export type DailyBriefingAttentionItem = MissionControlAttentionItem;

export interface DailyBriefingProjectHighlight {
  readonly projectId: string;
  readonly projectName: string;
  readonly healthState: MissionControlProjectHealthState;
  readonly attentionSeverity: MissionControlSeverity;
  readonly overdueTasks: number;
  readonly blockedTasks: number;
  readonly overdueMilestones: number;
  readonly dueSoonMilestones: number;
  readonly dueSoonTasks: number;
  readonly recentEventCount: number;
  readonly nextMilestoneDueDate?: string;
}

export interface DailyBriefingUpcomingItem {
  readonly kind: 'milestone' | 'task';
  readonly entityId: string;
  readonly title: string;
  readonly projectId: string;
  readonly projectName: string;
  readonly milestoneId?: string;
  readonly milestoneName?: string;
  readonly plannedEndDate?: string;
  readonly status: string;
  readonly priority?: string;
}

export interface DailyBriefingRecentChange {
  readonly eventId: string;
  readonly eventType: string;
  readonly aggregateType: string;
  readonly aggregateId: string;
  readonly occurredAt: string;
}

export type DailyBriefingEvidenceItem =
  | {
      readonly evidenceType: 'operationalEntity';
      readonly reference: EntityReference;
      readonly source: DailyBriefingEvidenceSource;
    }
  | {
      readonly evidenceType: 'domainEvent';
      readonly reference: EventEvidenceReference;
      readonly source: DailyBriefingEvidenceSource;
    };

export interface DailyBriefingCompleteness {
  readonly status: DailyBriefingCompletenessStatus;
  readonly degradationNotes: readonly string[];
}

export interface DailyBriefingSnapshotMetadata {
  readonly deterministic: true;
  readonly restrictedSlices: readonly MissionControlRestrictedSlice[];
  readonly missionControlGeneratedAt: Date;
}

export interface DailyBriefingSnapshot {
  readonly generatedAt: Date;
  readonly organization: {
    readonly organizationId: OrganizationId;
  };
  readonly briefingWindow: DailyBriefingWindow;
  readonly executiveSignals: DailyBriefingExecutiveSignals;
  readonly attentionItems: readonly DailyBriefingAttentionItem[];
  readonly projectHighlights: readonly DailyBriefingProjectHighlight[];
  readonly upcomingWork: readonly DailyBriefingUpcomingItem[];
  readonly recentChanges: readonly DailyBriefingRecentChange[];
  readonly evidence: readonly DailyBriefingEvidenceItem[];
  readonly completeness: DailyBriefingCompleteness;
  readonly metadata: DailyBriefingSnapshotMetadata;
}
