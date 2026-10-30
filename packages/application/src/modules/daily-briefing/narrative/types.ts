import type { AIProviderId } from '@synaptria/ai';

import type { DailyBriefingSnapshot } from '../types';
import type {
  DailyBriefingNarrativeV0StructuredOutput,
  GroundedNarrativeBlock,
} from './schema';
import type { DAILY_BRIEFING_NARRATIVE_CAPABILITY_ID } from './capability';

export type { GroundedNarrativeBlock } from './schema';

export type DailyBriefingNarrativeItem = GroundedNarrativeBlock;

export interface DailyBriefingNarrativeModelInputEvidenceEntry {
  readonly key: string;
  readonly label: string;
}

export interface DailyBriefingNarrativeModelInputAttentionItem {
  readonly evidenceKey: string;
  readonly type: string;
  readonly severity: string;
  readonly title: string;
  readonly reason: string;
  readonly dueDate?: string;
}

export interface DailyBriefingNarrativeModelInputProjectHighlight {
  readonly evidenceKey: string;
  readonly projectName: string;
  readonly healthState: string;
  readonly attentionSeverity: string;
  readonly overdueTasks: number;
  readonly blockedTasks: number;
  readonly overdueMilestones: number;
  readonly dueSoonMilestones: number;
  readonly dueSoonTasks: number;
  readonly recentEventCount: number;
  readonly nextMilestoneDueDate?: string;
}

export interface DailyBriefingNarrativeModelInputUpcomingItem {
  readonly evidenceKey: string;
  readonly kind: 'milestone' | 'task';
  readonly title: string;
  readonly projectName: string;
  readonly status: string;
  readonly plannedEndDate?: string;
  readonly priority?: string;
}

export interface DailyBriefingNarrativeModelInputRecentChange {
  readonly evidenceKey: string;
  readonly eventType: string;
  readonly aggregateType: string;
  readonly occurredAt: string;
}

export interface DailyBriefingNarrativeModelInput {
  readonly capabilityVersion: 'v0';
  readonly briefingWindow: {
    readonly lookbackHours: number;
    readonly startsAt: string;
    readonly endsAt: string;
  };
  readonly attentionItems: readonly DailyBriefingNarrativeModelInputAttentionItem[];
  readonly projectHighlights: readonly DailyBriefingNarrativeModelInputProjectHighlight[];
  readonly upcomingWork: readonly DailyBriefingNarrativeModelInputUpcomingItem[];
  readonly recentChanges: readonly DailyBriefingNarrativeModelInputRecentChange[];
  readonly evidenceCatalog: readonly DailyBriefingNarrativeModelInputEvidenceEntry[];
  readonly narrativeTargets: {
    readonly attentionEvidenceKeys: readonly string[];
    readonly projectHighlightEvidenceKeys: readonly string[];
    readonly upcomingWorkEvidenceKeys: readonly string[];
    readonly recentChangeEvidenceKeys: readonly string[];
  };
  readonly completeness: {
    readonly status: DailyBriefingSnapshot['completeness']['status'];
    readonly degradationNotes: DailyBriefingSnapshot['completeness']['degradationNotes'];
  };
  readonly restrictedSlices: DailyBriefingSnapshot['metadata']['restrictedSlices'];
}

export interface DailyBriefingNarrativeGenerationMetadata {
  readonly provider: AIProviderId;
  readonly model: string;
  readonly usage: {
    readonly inputTokens?: number;
    readonly outputTokens?: number;
    readonly totalTokens?: number;
    readonly reasoningTokens?: number;
  };
  readonly latencyMs: number;
}

export interface DailyBriefingNarrative {
  readonly capabilityId: typeof DAILY_BRIEFING_NARRATIVE_CAPABILITY_ID;
  readonly headline: GroundedNarrativeBlock;
  readonly executiveSummary: GroundedNarrativeBlock;
  readonly attentionItems: readonly DailyBriefingNarrativeItem[];
  readonly projectHighlightItems: readonly DailyBriefingNarrativeItem[];
  readonly upcomingWorkItems: readonly DailyBriefingNarrativeItem[];
  readonly recentChangeItems: readonly DailyBriefingNarrativeItem[];
  readonly completenessNote?: string;
  readonly sourceSnapshotGeneratedAt: Date;
  readonly generation: DailyBriefingNarrativeGenerationMetadata;
}

export type DailyBriefingNarrativeStructuredPayload = DailyBriefingNarrativeV0StructuredOutput;
