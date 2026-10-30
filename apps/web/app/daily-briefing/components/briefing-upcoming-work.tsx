import type { DailyBriefingUpcomingItem } from '@synaptria/application';
import Link from 'next/link';
import { Suspense } from 'react';

import type { DailyBriefingNarrativeResult } from '../../../lib/daily-briefing-loader';
import { UPCOMING_WORK_HEADING } from './daily-briefing-ui-constants';
import { DailyBriefingGroundedItemNarrative } from './daily-briefing-narrative-stream';
import {
  DAILY_BRIEFING_EMPTY_UPCOMING_MESSAGE,
  formatOptionalMissionControlDate,
  getDailyBriefingUpcomingHref,
  upcomingWorkEvidenceKey,
} from '../daily-briefing-format';

export interface DailyBriefingUpcomingWorkProps {
  readonly items: readonly DailyBriefingUpcomingItem[];
  readonly narrativePromise?: Promise<DailyBriefingNarrativeResult>;
}

export function DailyBriefingUpcomingWork({
  items,
  narrativePromise,
}: DailyBriefingUpcomingWorkProps) {
  return (
    <section
      className="mission-control-panel"
      aria-labelledby="daily-briefing-upcoming-heading"
    >
      <div className="mission-control-panel-header">
        <h2 id="daily-briefing-upcoming-heading">{UPCOMING_WORK_HEADING}</h2>
        <p className="mission-control-panel-description">
          Due-soon milestones and tasks from the operational snapshot.
        </p>
      </div>

      {items.length === 0 ? (
        <p className="mission-control-empty-state">{DAILY_BRIEFING_EMPTY_UPCOMING_MESSAGE}</p>
      ) : (
        <ul className="mission-control-upcoming-list">
          {items.map((item) => (
            <DailyBriefingUpcomingRow
              key={`${item.kind}:${item.entityId}`}
              item={item}
              {...(narrativePromise === undefined ? {} : { narrativePromise })}
            />
          ))}
        </ul>
      )}
    </section>
  );
}

function DailyBriefingUpcomingRow({
  item,
  narrativePromise,
}: {
  readonly item: DailyBriefingUpcomingItem;
  readonly narrativePromise?: Promise<DailyBriefingNarrativeResult>;
}) {
  const href = getDailyBriefingUpcomingHref(item);

  const content = (
    <>
      <div className="mission-control-upcoming-meta">
        <span className="mission-control-entity-type">
          {item.kind === 'milestone' ? 'Milestone' : 'Task'}
        </span>
        <span className="mission-control-upcoming-due">
          Due {formatOptionalMissionControlDate(item.plannedEndDate)}
        </span>
      </div>
      <strong className="mission-control-item-title">{item.title}</strong>
      <p className="mission-control-item-context">
        {item.projectName}
        {item.milestoneName === undefined ? '' : ` · ${item.milestoneName}`}
      </p>
      <p className="mission-control-item-status">{item.status}</p>
      {narrativePromise === undefined ? null : (
        <Suspense fallback={null}>
          <DailyBriefingGroundedItemNarrative
            narrativePromise={narrativePromise}
            evidenceKey={upcomingWorkEvidenceKey(item)}
            items="upcomingWorkItems"
          />
        </Suspense>
      )}
    </>
  );

  if (href === null) {
    return <li className="mission-control-upcoming-item">{content}</li>;
  }

  return (
    <li className="mission-control-upcoming-item">
      <Link className="mission-control-item-link" href={href}>
        {content}
      </Link>
    </li>
  );
}
