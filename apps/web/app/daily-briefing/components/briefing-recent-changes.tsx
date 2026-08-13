import type { DailyBriefingRecentChange } from '@synaptria/application';
import Link from 'next/link';
import { Suspense } from 'react';

import type { DailyBriefingNarrativeResult } from '../../../lib/daily-briefing-loader';
import { RECENT_CHANGES_HEADING } from './daily-briefing-ui-constants';
import { DailyBriefingGroundedItemNarrative } from './daily-briefing-narrative-stream';
import {
  DAILY_BRIEFING_EMPTY_RECENT_CHANGES_MESSAGE,
  formatMissionControlDateTime,
  getDailyBriefingRecentChangeHref,
  recentChangeEvidenceKey,
} from '../daily-briefing-format';

export interface DailyBriefingRecentChangesProps {
  readonly changes: readonly DailyBriefingRecentChange[];
  readonly narrativePromise?: Promise<DailyBriefingNarrativeResult>;
}

export function DailyBriefingRecentChanges({
  changes,
  narrativePromise,
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
          {changes.map((change) => (
            <DailyBriefingRecentChangeRow
              key={change.eventId}
              change={change}
              {...(narrativePromise === undefined ? {} : { narrativePromise })}
            />
          ))}
        </ul>
      )}
    </section>
  );
}

function DailyBriefingRecentChangeRow({
  change,
  narrativePromise,
}: {
  readonly change: DailyBriefingRecentChange;
  readonly narrativePromise?: Promise<DailyBriefingNarrativeResult>;
}) {
  const href = getDailyBriefingRecentChangeHref(change);

  const content = (
    <>
      <div className="mission-control-activity-meta">
        <span className="mission-control-activity-type">{change.eventType}</span>
        <time dateTime={change.occurredAt}>
          {formatMissionControlDateTime(change.occurredAt)}
        </time>
      </div>
      <p className="mission-control-activity-aggregate">{change.aggregateType}</p>
      {narrativePromise === undefined ? null : (
        <Suspense fallback={null}>
          <DailyBriefingGroundedItemNarrative
            narrativePromise={narrativePromise}
            evidenceKey={recentChangeEvidenceKey(change)}
            items="recentChangeItems"
          />
        </Suspense>
      )}
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
