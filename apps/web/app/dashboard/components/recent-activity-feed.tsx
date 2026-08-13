import type { MissionControlRecentActivityItem } from '@synaptria/application/mission-control';

import { RECENT_ACTIVITY_HEADING } from './mission-control-ui-constants';
import {
  formatAggregateTypeLabel,
  formatEventTypeLabel,
  formatMissionControlDateTime,
  getRecentActivityHref,
  MISSION_CONTROL_EMPTY_RECENT_ACTIVITY_MESSAGE,
  MISSION_CONTROL_RECENT_ACTIVITY_DISPLAY_LIMIT,
} from '../mission-control-format';
import Link from 'next/link';

export interface RecentActivityFeedProps {
  readonly recentActivity: readonly MissionControlRecentActivityItem[];
}

export function RecentActivityFeed({ recentActivity }: RecentActivityFeedProps) {
  const visibleItems = recentActivity.slice(0, MISSION_CONTROL_RECENT_ACTIVITY_DISPLAY_LIMIT);

  return (
    <section
      className="mission-control-panel"
      aria-labelledby="mission-control-activity-heading"
    >
      <div className="mission-control-panel-header">
        <h2 id="mission-control-activity-heading">{RECENT_ACTIVITY_HEADING}</h2>
        <p className="mission-control-panel-description">
          Latest organization events across programs and execution.
        </p>
      </div>

      {visibleItems.length === 0 ? (
        <p className="mission-control-empty-state">
          {MISSION_CONTROL_EMPTY_RECENT_ACTIVITY_MESSAGE}
        </p>
      ) : (
        <ul className="mission-control-activity-list">
          {visibleItems.map((item) => (
            <RecentActivityItem key={item.eventId} item={item} />
          ))}
        </ul>
      )}
    </section>
  );
}

function RecentActivityItem({
  item,
}: {
  readonly item: MissionControlRecentActivityItem;
}) {
  const href = getRecentActivityHref(item);
  const eventLabel = formatEventTypeLabel(item.eventType);
  const aggregateLabel = formatAggregateTypeLabel(item.aggregateType);
  const timestamp = formatMissionControlDateTime(item.occurredAt);

  const content = (
    <>
      <div className="mission-control-activity-meta">
        <span className="mission-control-activity-type">{eventLabel}</span>
        <time dateTime={item.occurredAt}>{timestamp}</time>
      </div>
      <p className="mission-control-activity-aggregate">{aggregateLabel}</p>
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
