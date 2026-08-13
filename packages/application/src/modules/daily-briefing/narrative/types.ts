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
  readonly evidenceType: 'operationalEntity' | 'domainEvent';
  readonly reference: Readonly<Record<string, string>>;
}

export interface DailyBriefingNarrativeModelInput {
  readonly capabilityVersion: 'v0';
  readonly generatedAt: string;
  readonly organizationId: string;
  readonly briefingWindow: {
    readonly lookbackHours: number;
    readonly startsAt: string;
    readonly endsAt: string;
  };
  readonly executiveSignals: DailyBriefingSnapshot['executiveSignals'];
  readonly attentionItems: DailyBriefingSnapshot['attentionItems'];
  readonly projectHighlights: DailyBriefingSnapshot['projectHighlights'];
  readonly upcomingWork: DailyBriefingSnapshot['upcomingWork'];
  readonly recentChanges: DailyBriefingSnapshot['recentChanges'];
  readonly evidenceCatalog: readonly DailyBriefingNarrativeModelInputEvidenceEntry[];
  readonly completeness: DailyBriefingSnapshot['completeness'];
  readonly metadata: {
    readonly restrictedSlices: DailyBriefingSnapshot['metadata']['restrictedSlices'];
    readonly missionControlGeneratedAt: string;
  };
}

export interface DailyBriefingNarrativeGenerationMetadata {
  readonly provider: AIProviderId;
  readonly model: string;
  readonly usage: {
    readonly inputTokens?: number;
    readonly outputTokens?: number;
    readonly totalTokens?: number;
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
