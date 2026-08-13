import {
  DAILY_BRIEFING_NARRATIVE_ATTENTION_LIMIT,
  DAILY_BRIEFING_NARRATIVE_PROJECT_HIGHLIGHT_LIMIT,
  DAILY_BRIEFING_NARRATIVE_RECENT_CHANGE_LIMIT,
  DAILY_BRIEFING_NARRATIVE_UPCOMING_LIMIT,
} from '../constants';
import {
  attentionItemEvidenceKey,
  projectHighlightEvidenceKey,
  recentChangeEvidenceKey,
  upcomingWorkEvidenceKey,
} from '../evidence-keys';
import type { DailyBriefingSnapshot } from '../types';

export interface DailyBriefingNarrativeTargets {
  readonly attentionEvidenceKeys: readonly string[];
  readonly projectHighlightEvidenceKeys: readonly string[];
  readonly upcomingWorkEvidenceKeys: readonly string[];
  readonly recentChangeEvidenceKeys: readonly string[];
}

export function selectDailyBriefingNarrativeTargets(
  snapshot: DailyBriefingSnapshot,
): DailyBriefingNarrativeTargets {
  return {
    attentionEvidenceKeys: snapshot.attentionItems
      .slice(0, DAILY_BRIEFING_NARRATIVE_ATTENTION_LIMIT)
      .map(attentionItemEvidenceKey),
    projectHighlightEvidenceKeys: snapshot.projectHighlights
      .slice(0, DAILY_BRIEFING_NARRATIVE_PROJECT_HIGHLIGHT_LIMIT)
      .map(projectHighlightEvidenceKey),
    upcomingWorkEvidenceKeys: snapshot.upcomingWork
      .slice(0, DAILY_BRIEFING_NARRATIVE_UPCOMING_LIMIT)
      .map(upcomingWorkEvidenceKey),
    recentChangeEvidenceKeys: snapshot.recentChanges
      .slice(0, DAILY_BRIEFING_NARRATIVE_RECENT_CHANGE_LIMIT)
      .map(recentChangeEvidenceKey),
  };
}
