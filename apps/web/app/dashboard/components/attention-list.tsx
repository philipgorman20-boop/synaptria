import type { MissionControlAttentionItem } from '@synaptria/application/mission-control';
import Link from 'next/link';

import { ATTENTION_LIST_HEADING } from './mission-control-ui-constants';
import {
  formatAttentionType,
  formatMissionControlSeverity,
  formatOptionalMissionControlDate,
  getAttentionItemHref,
  MISSION_CONTROL_ATTENTION_LIMIT,
  MISSION_CONTROL_EMPTY_ATTENTION_MESSAGE,
} from '../mission-control-format';

export interface AttentionListProps {
  readonly items: readonly MissionControlAttentionItem[];
}

export function AttentionList({ items }: AttentionListProps) {
  const visibleItems = items.slice(0, MISSION_CONTROL_ATTENTION_LIMIT);

  return (
    <section
      className="mission-control-panel"
      aria-labelledby="mission-control-attention-heading"
    >
      <div className="mission-control-panel-header">
        <h2 id="mission-control-attention-heading">{ATTENTION_LIST_HEADING}</h2>
        <p className="mission-control-panel-description">
          Overdue, blocked, and due-soon work requiring action.
        </p>
      </div>

      {visibleItems.length === 0 ? (
        <p className="mission-control-empty-state">{MISSION_CONTROL_EMPTY_ATTENTION_MESSAGE}</p>
      ) : (
        <ul className="mission-control-attention-list">
          {visibleItems.map((item) => (
            <AttentionListItem key={attentionItemKey(item)} item={item} />
          ))}
        </ul>
      )}
    </section>
  );
}

function AttentionListItem({ item }: { readonly item: MissionControlAttentionItem }) {
  const href = getAttentionItemHref(item);
  const severityLabel = formatMissionControlSeverity(item.severity);
  const typeLabel = formatAttentionType(item.type);
  const dueDateLabel = formatOptionalMissionControlDate(item.dueDate);

  const content = (
    <>
      <div className="mission-control-attention-meta">
        <span
          className="mission-control-severity-badge"
          data-severity={item.severity}
        >
          {severityLabel}
        </span>
        <span className="mission-control-type-label">{typeLabel}</span>
      </div>
      <div className="mission-control-attention-body">
        <strong className="mission-control-item-title">{item.title}</strong>
        <p className="mission-control-item-reason">{item.reason}</p>
        {item.dueDate !== undefined ? (
          <p className="mission-control-item-details">Due {dueDateLabel}</p>
        ) : null}
      </div>
    </>
  );

  if (href === null) {
    return (
      <li className="mission-control-attention-item">
        {content}
      </li>
    );
  }

  return (
    <li className="mission-control-attention-item">
      <Link className="mission-control-item-link" href={href}>
        {content}
      </Link>
    </li>
  );
}

function attentionItemKey(item: MissionControlAttentionItem): string {
  return `${item.type}:${item.entity.entityType}:${item.entity.entityId}:${item.eventId ?? ''}`;
}
