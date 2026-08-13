import type { JsonSchema } from '@synaptria/ai';

import {
  DAILY_BRIEFING_NARRATIVE_ATTENTION_LIMIT,
  DAILY_BRIEFING_NARRATIVE_PROJECT_HIGHLIGHT_LIMIT,
  DAILY_BRIEFING_NARRATIVE_RECENT_CHANGE_LIMIT,
  DAILY_BRIEFING_NARRATIVE_UPCOMING_LIMIT,
} from '../constants';

const groundedNarrativeBlockSchema: JsonSchema = {
  type: 'object',
  properties: {
    text: {
      type: 'string',
      description: 'Grounded narrative statement derived only from supplied snapshot facts.',
    },
    evidenceKeys: {
      type: 'array',
      items: {
        type: 'string',
        description: 'Evidence catalog keys supporting the statement.',
      },
    },
  },
  required: ['text', 'evidenceKeys'],
  additionalProperties: false,
};

export const DAILY_BRIEFING_NARRATIVE_V0_JSON_SCHEMA: JsonSchema = {
  type: 'object',
  properties: {
    headline: {
      ...groundedNarrativeBlockSchema,
      description: 'Brief grounded headline summarizing the daily briefing.',
    },
    executiveSummary: {
      ...groundedNarrativeBlockSchema,
      description:
        'Short grounded executive summary synthesized only from supplied snapshot facts.',
    },
    attentionItems: {
      type: 'array',
      maxItems: DAILY_BRIEFING_NARRATIVE_ATTENTION_LIMIT,
      items: groundedNarrativeBlockSchema,
      description:
        'Optional short narratives for high-priority attention items listed in narrativeTargets.attentionEvidenceKeys.',
    },
    projectHighlightItems: {
      type: 'array',
      maxItems: DAILY_BRIEFING_NARRATIVE_PROJECT_HIGHLIGHT_LIMIT,
      items: groundedNarrativeBlockSchema,
      description:
        'Optional short narratives for project highlights listed in narrativeTargets.projectHighlightEvidenceKeys.',
    },
    upcomingWorkItems: {
      type: 'array',
      maxItems: DAILY_BRIEFING_NARRATIVE_UPCOMING_LIMIT,
      items: groundedNarrativeBlockSchema,
      description:
        'Optional short narratives for upcoming work items listed in narrativeTargets.upcomingWorkEvidenceKeys.',
    },
    recentChangeItems: {
      type: 'array',
      maxItems: DAILY_BRIEFING_NARRATIVE_RECENT_CHANGE_LIMIT,
      items: groundedNarrativeBlockSchema,
      description:
        'Optional short narratives for recent changes listed in narrativeTargets.recentChangeEvidenceKeys.',
    },
    completenessNote: {
      type: ['string', 'null'],
      description:
        'Optional note reflecting supplied completeness/degradation context without inventing missing facts. Use null when no note is warranted.',
    },
  },
  required: [
    'headline',
    'executiveSummary',
    'attentionItems',
    'projectHighlightItems',
    'upcomingWorkItems',
    'recentChangeItems',
    'completenessNote',
  ],
  additionalProperties: false,
};

export interface GroundedNarrativeBlock {
  readonly text: string;
  readonly evidenceKeys: readonly string[];
}

export interface DailyBriefingNarrativeV0StructuredOutput {
  readonly headline: GroundedNarrativeBlock;
  readonly executiveSummary: GroundedNarrativeBlock;
  readonly attentionItems: readonly GroundedNarrativeBlock[];
  readonly projectHighlightItems: readonly GroundedNarrativeBlock[];
  readonly upcomingWorkItems: readonly GroundedNarrativeBlock[];
  readonly recentChangeItems: readonly GroundedNarrativeBlock[];
  readonly completenessNote: string | null;
}

export const DAILY_BRIEFING_NARRATIVE_FACTUAL_ITEM_FIELDS = [
  'attentionItems',
  'projectHighlightItems',
  'upcomingWorkItems',
  'recentChangeItems',
] as const;

export type DailyBriefingNarrativeFactualItemField =
  (typeof DAILY_BRIEFING_NARRATIVE_FACTUAL_ITEM_FIELDS)[number];
