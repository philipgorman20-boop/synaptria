import type { DailyBriefingSnapshot } from '@synaptria/application';

import type { DailyBriefingNarrativeResult } from '../../../lib/daily-briefing-loader';
import {
  DAILY_BRIEFING_NARRATIVE_LOADING_MESSAGE,
} from '../../../lib/daily-briefing-loader';

import { DailyBriefingAiStatus } from './daily-briefing-ai-status';
import { DailyBriefingExecutiveSummary } from './executive-summary';
import { EXECUTIVE_SUMMARY_HEADING } from './daily-briefing-ui-constants';
import {
  findNarrativeForEvidenceKey,
  formatEvidenceSourceCount,
  resolveBriefingHeadline,
  resolveExecutiveSummary,
} from '../daily-briefing-format';

export function DailyBriefingExecutiveSummaryLoading() {
  return (
    <section
      className="mission-control-panel daily-briefing-summary-panel daily-briefing-summary-loading"
      aria-labelledby="daily-briefing-summary-heading"
      aria-busy="true"
    >
      <div className="mission-control-panel-header">
        <h2 id="daily-briefing-summary-heading">{EXECUTIVE_SUMMARY_HEADING}</h2>
      </div>
      <p className="daily-briefing-loading-copy">{DAILY_BRIEFING_NARRATIVE_LOADING_MESSAGE}</p>
    </section>
  );
}

export function DailyBriefingNarrativeLoadingStatus() {
  return (
    <aside
      className="daily-briefing-ai-status daily-briefing-ai-status-loading"
      aria-label="AI summary status"
      role="status"
      aria-busy="true"
    >
      <p>{DAILY_BRIEFING_NARRATIVE_LOADING_MESSAGE}</p>
    </aside>
  );
}

export async function DailyBriefingHeadlineContent({
  narrativePromise,
  snapshot,
}: {
  readonly narrativePromise: Promise<DailyBriefingNarrativeResult>;
  readonly snapshot: DailyBriefingSnapshot;
}) {
  const result = await narrativePromise;
  return resolveBriefingHeadline(result.narrative, snapshot);
}

export async function DailyBriefingNarrativeStatusContent({
  narrativePromise,
}: {
  readonly narrativePromise: Promise<DailyBriefingNarrativeResult>;
}) {
  const result = await narrativePromise;

  if (!result.aiSummaryUnavailable) {
    return null;
  }

  return <DailyBriefingAiStatus aiSummaryUnavailable={true} />;
}

export async function DailyBriefingExecutiveSummaryContent({
  narrativePromise,
}: {
  readonly narrativePromise: Promise<DailyBriefingNarrativeResult>;
}) {
  const result = await narrativePromise;
  const summary = resolveExecutiveSummary(result.narrative);

  if (summary === null) {
    return null;
  }

  return <DailyBriefingExecutiveSummary summary={summary} />;
}

export async function DailyBriefingCompletenessNoteContent({
  narrativePromise,
}: {
  readonly narrativePromise: Promise<DailyBriefingNarrativeResult>;
}) {
  const result = await narrativePromise;
  const completenessNote = result.narrative?.completenessNote;

  if (completenessNote === undefined) {
    return null;
  }

  return (
    <aside className="daily-briefing-completeness-note" aria-label="AI completeness note">
      <p className="daily-briefing-note-label">AI note</p>
      <p className="daily-briefing-narrative-secondary">{completenessNote}</p>
    </aside>
  );
}

export async function DailyBriefingGroundedItemNarrative({
  narrativePromise,
  evidenceKey,
  items,
}: {
  readonly narrativePromise: Promise<DailyBriefingNarrativeResult>;
  readonly evidenceKey: string;
  readonly items:
    | 'attentionItems'
    | 'projectHighlightItems'
    | 'upcomingWorkItems'
    | 'recentChangeItems';
}) {
  const result = await narrativePromise;

  if (result.narrative === null) {
    return null;
  }

  const narrative = findNarrativeForEvidenceKey(result.narrative[items], evidenceKey);

  if (narrative === undefined) {
    return null;
  }

  const sourceCount = formatEvidenceSourceCount(narrative.evidenceKeys);

  return (
    <>
      <p className="daily-briefing-narrative-secondary">{narrative.text}</p>
      {sourceCount !== null ? <p className="daily-briefing-source-count">{sourceCount}</p> : null}
    </>
  );
}
