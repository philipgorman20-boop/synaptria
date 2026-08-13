import type {
  DailyBriefingNarrative,
  DailyBriefingUpcomingItem,
} from '@synaptria/application';
import Link from 'next/link';

import { UPCOMING_WORK_HEADING } from './daily-briefing-ui-constants';
import {
  DAILY_BRIEFING_EMPTY_UPCOMING_MESSAGE,
  findNarrativeForEvidenceKey,
  formatEvidenceSourceCount,
  formatOptionalMissionControlDate,
  getDailyBriefingUpcomingHref,
  upcomingWorkEvidenceKey,
} from '../daily-briefing-format';

export interface DailyBriefingUpcomingWorkProps {
  readonly items: readonly DailyBriefingUpcomingItem[];
  readonly narrative: DailyBriefingNarrative | null;
}

export function DailyBriefingUpcomingWork({
  items,
  narrative,
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
          {items.map((item) => {
            const matchedNarrative =
              narrative === null
                ? undefined
                : findNarrativeForEvidenceKey(
                    narrative.upcomingWorkItems,
                    upcomingWorkEvidenceKey(item),
                  );

            return (
              <DailyBriefingUpcomingRow
                key={`${item.kind}:${item.entityId}`}
                item={item}
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

function DailyBriefingUpcomingRow({
  item,
  narrative,
}: {
  readonly item: DailyBriefingUpcomingItem;
  readonly narrative?: { readonly text: string; readonly evidenceKeys: readonly string[] };
}) {
  const href = getDailyBriefingUpcomingHref(item);
  const sourceCount =
    narrative === undefined ? null : formatEvidenceSourceCount(narrative.evidenceKeys);

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
      {narrative !== undefined ? (
        <p className="daily-briefing-narrative-secondary">{narrative.text}</p>
      ) : null}
      {sourceCount !== null ? (
        <p className="daily-briefing-source-count">{sourceCount}</p>
      ) : null}
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
