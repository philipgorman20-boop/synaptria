import { routes } from '@synaptria/config';
import Link from 'next/link';

import { UPCOMING_HEADING } from './mission-control-ui-constants';
import {
  buildUpcomingWorkItems,
  formatUpcomingContext,
  formatUpcomingDueDate,
  formatUpcomingEntityType,
  formatUpcomingStatus,
  formatUpcomingTitle,
  getUpcomingItemHref,
  MISSION_CONTROL_EMPTY_UPCOMING_MESSAGE,
  type UpcomingWorkItem,
} from '../mission-control-format';
import type {
  MissionControlMilestoneSignal,
  MissionControlTaskSignal,
} from '@synaptria/application/mission-control';

export interface UpcomingWorkProps {
  readonly milestoneSignals: readonly MissionControlMilestoneSignal[];
  readonly taskSignals: readonly MissionControlTaskSignal[];
}

export function UpcomingWork({ milestoneSignals, taskSignals }: UpcomingWorkProps) {
  const items = buildUpcomingWorkItems(milestoneSignals, taskSignals);

  return (
    <section
      className="mission-control-panel"
      aria-labelledby="mission-control-upcoming-heading"
    >
      <div className="mission-control-panel-header">
        <h2 id="mission-control-upcoming-heading">{UPCOMING_HEADING}</h2>
        <p className="mission-control-panel-description">
          Milestones and tasks due within the next week.
        </p>
      </div>

      {items.length === 0 ? (
        <p className="mission-control-empty-state">{MISSION_CONTROL_EMPTY_UPCOMING_MESSAGE}</p>
      ) : (
        <>
          <ul className="mission-control-upcoming-list">
            {items.map((item) => (
              <UpcomingWorkItemRow key={upcomingItemKey(item)} item={item} />
            ))}
          </ul>
          <p className="mission-control-panel-footer">
            <Link className="mission-control-inline-link" href={routes.projects}>
              View all projects
            </Link>
          </p>
        </>
      )}
    </section>
  );
}

function UpcomingWorkItemRow({ item }: { readonly item: UpcomingWorkItem }) {
  return (
    <li className="mission-control-upcoming-item">
      <Link className="mission-control-item-link" href={getUpcomingItemHref(item)}>
        <div className="mission-control-upcoming-meta">
          <span className="mission-control-entity-type">
            {formatUpcomingEntityType(item)}
          </span>
          <span className="mission-control-upcoming-due">
            Due {formatUpcomingDueDate(item)}
          </span>
        </div>
        <strong className="mission-control-item-title">{formatUpcomingTitle(item)}</strong>
        <p className="mission-control-item-context">{formatUpcomingContext(item)}</p>
        <p className="mission-control-item-status">{formatUpcomingStatus(item)}</p>
      </Link>
    </li>
  );
}

function upcomingItemKey(item: UpcomingWorkItem): string {
  return item.kind === 'milestone'
    ? `milestone:${item.signal.milestoneId}`
    : `task:${item.signal.taskId}`;
}
