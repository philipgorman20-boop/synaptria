/** Versioned AI capability identifier for Daily Briefing narrative rendering. */
export const DAILY_BRIEFING_NARRATIVE_CAPABILITY_ID = 'daily-briefing.narrative.v0' as const;

export const DAILY_BRIEFING_NARRATIVE_CAPABILITY_VERSION = 'v0' as const;

export const DAILY_BRIEFING_NARRATIVE_SCHEMA_NAME = 'daily_briefing_narrative_v0';

/**
 * Conservative output token budget for daily-briefing.narrative.v0.
 * OpenAI max_output_tokens includes hidden reasoning tokens plus visible
 * structured output. Bounded item arrays (5/4/3/3) keep visible prose small,
 * but reasoning models need headroom for low-effort synthesis and strict JSON.
 */
export const DAILY_BRIEFING_NARRATIVE_MAX_OUTPUT_TOKENS = 3000;

/** Constrained synthesis over authoritative snapshot data; not deep reasoning. */
export const DAILY_BRIEFING_NARRATIVE_REASONING_EFFORT = 'low' as const;
