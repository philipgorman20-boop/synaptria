import type {
  DailyBriefingNarrative,
  DailyBriefingRecentChange,
} from '@synaptria/application';
import Link from 'next/link';

import { RECENT_CHANGES_HEADING } from './daily-briefing-ui-constants';
import {
  DAILY_BRIEFING_EMPTY_RECENT_CHANGES_MESSAGE,
  findNarrativeForEvidenceKey,
  formatEvidenceSourceCount,
  formatMissionControlDateTime,
  getDailyBriefingRecentChangeHref,
  recentChangeEvidenceKey,
} from '../daily-briefing-format';

export interface DailyBriefingRecentChangesProps {
  readonly changes: readonly DailyBriefingRecentChange[];
  readonly narrative: DailyBriefingNarrative | null;
}

export function DailyBriefingRecentChanges({
  changes,
  narrative,
}: DailyBriefingRecentChangesProps) {
  return (
    <section
      className="mission-control-panel"
      aria-labelledby="daily-briefing-recent-heading"
    >
      <div className="mission-control-panel-header">
        <h2 id="daily-briefing-recent-heading">{RECENT_CHANGES_HEADING}</h2>
        <p className="mission-control-panel-description">
          Organization events within the briefing window.
        </p>
      </div>

      {changes.length === 0 ? (
        <p className="mission-control-empty-state">
          {DAILY_BRIEFING_EMPTY_RECENT_CHANGES_MESSAGE}
        </p>
      ) : (
        <ul className="mission-control-activity-list">
          {changes.map((change) => {
            const matchedNarrative =
              narrative === null
                ? undefined
                : findNarrativeForEvidenceKey(
                    narrative.recentChangeItems,
                    recentChangeEvidenceKey(change),
                  );

            return (
              <DailyBriefingRecentChangeRow
                key={change.eventId}
                change={change}
                {...(matchedNarrative === undefined
                  ? {}
                  : { narrative: matchedNarrative })}
              />
            );
          })}
        </ul>
      )}
    </section>
  );
}

function DailyBriefingRecentChangeRow({
  change,
  narrative,
}: {
  readonly change: DailyBriefingRecentChange;
  readonly narrative?: { readonly text: string; readonly evidenceKeys: readonly string[] };
}) {
  const href = getDailyBriefingRecentChangeHref(change);
  const sourceCount =
    narrative === undefined ? null : formatEvidenceSourceCount(narrative.evidenceKeys);

  const content = (
    <>
      <div className="mission-control-activity-meta">
        <span className="mission-control-activity-type">{change.eventType}</span>
        <time dateTime={change.occurredAt}>
          {formatMissionControlDateTime(change.occurredAt)}
        </time>
      </div>
      <p className="mission-control-activity-aggregate">{change.aggregateType}</p>
      {narrative !== undefined ? (
        <p className="daily-briefing-narrative-secondary">{narrative.text}</p>
      ) : null}
      {sourceCount !== null ? (
        <p className="daily-briefing-source-count">{sourceCount}</p>
      ) : null}
    </>
  );

  if (href === null) {
    return <li className="mission-control-activity-item">{content}</li>;
  }

  return (
    <li className="mission-control-activity-item">
      <Link className="mission-control-item-link" href={href}>
        {content}
      </Link>
    </li>
  );
}
