import type { JsonSchema } from '@synaptria/ai';

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
      items: groundedNarrativeBlockSchema,
    },
    projectHighlightItems: {
      type: 'array',
      items: groundedNarrativeBlockSchema,
    },
    upcomingWorkItems: {
      type: 'array',
      items: groundedNarrativeBlockSchema,
    },
    recentChangeItems: {
      type: 'array',
      items: groundedNarrativeBlockSchema,
    },
    completenessNote: {
      type: 'string',
      description:
        'Optional note reflecting supplied completeness/degradation context without inventing missing facts.',
    },
  },
  required: [
    'headline',
    'executiveSummary',
    'attentionItems',
    'projectHighlightItems',
    'upcomingWorkItems',
    'recentChangeItems',
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
  readonly completenessNote?: string;
}

export const DAILY_BRIEFING_NARRATIVE_FACTUAL_ITEM_FIELDS = [
  'attentionItems',
  'projectHighlightItems',
  'upcomingWorkItems',
  'recentChangeItems',
] as const;

export type DailyBriefingNarrativeFactualItemField =
  (typeof DAILY_BRIEFING_NARRATIVE_FACTUAL_ITEM_FIELDS)[number];
