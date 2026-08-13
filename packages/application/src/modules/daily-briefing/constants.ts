/** Default briefing lookback window in hours. */
export const DAILY_BRIEFING_DEFAULT_LOOKBACK_HOURS = 24;

/** Maximum attention items included in a briefing snapshot. */
export const DAILY_BRIEFING_ATTENTION_LIMIT = 10;

/** Maximum project highlights included in a briefing snapshot. */
export const DAILY_BRIEFING_PROJECT_HIGHLIGHT_LIMIT = 6;

/** Maximum upcoming work items included in a briefing snapshot. */
export const DAILY_BRIEFING_UPCOMING_LIMIT = 10;

/** Maximum recent changes included in a briefing snapshot. */
export const DAILY_BRIEFING_RECENT_CHANGES_LIMIT = 25;

export const DAILY_BRIEFING_MILLISECONDS_PER_HOUR = 60 * 60 * 1000;

export const DAILY_BRIEFING_COMPLETENESS_STATUSES = [
  'complete',
  'degraded',
  'insufficient',
] as const;

export type DailyBriefingCompletenessStatus =
  (typeof DAILY_BRIEFING_COMPLETENESS_STATUSES)[number];

export const DAILY_BRIEFING_EVIDENCE_SOURCES = [
  'missionControl',
  'recentEvents',
] as const;

export type DailyBriefingEvidenceSource =
  (typeof DAILY_BRIEFING_EVIDENCE_SOURCES)[number];
