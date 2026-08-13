import type {
  DailyBriefingAttentionItem,
  DailyBriefingNarrative,
} from '@synaptria/application';
import Link from 'next/link';

import { ATTENTION_HEADING } from './daily-briefing-ui-constants';
import {
  DAILY_BRIEFING_EMPTY_ATTENTION_MESSAGE,
  attentionEvidenceKey,
  findNarrativeForEvidenceKey,
  formatAttentionType,
  formatEvidenceSourceCount,
  formatMissionControlSeverity,
  formatOptionalMissionControlDate,
  getAttentionItemHref,
} from '../daily-briefing-format';

export interface DailyBriefingAttentionListProps {
  readonly items: readonly DailyBriefingAttentionItem[];
  readonly narrative: DailyBriefingNarrative | null;
}

export function DailyBriefingAttentionList({
  items,
  narrative,
}: DailyBriefingAttentionListProps) {
  return (
    <section
      className="mission-control-panel"
      aria-labelledby="daily-briefing-attention-heading"
    >
      <div className="mission-control-panel-header">
        <h2 id="daily-briefing-attention-heading">{ATTENTION_HEADING}</h2>
        <p className="mission-control-panel-description">
          Overdue, blocked, and due-soon work requiring action.
        </p>
      </div>

      {items.length === 0 ? (
        <p className="mission-control-empty-state">{DAILY_BRIEFING_EMPTY_ATTENTION_MESSAGE}</p>
      ) : (
        <ul className="mission-control-attention-list">
          {items.map((item) => {
            const matchedNarrative =
              narrative === null
                ? undefined
                : findNarrativeForEvidenceKey(
                    narrative.attentionItems,
                    attentionEvidenceKey(item),
                  );

            return (
              <DailyBriefingAttentionItemRow
                key={attentionItemKey(item)}
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

function DailyBriefingAttentionItemRow({
  item,
  narrative,
}: {
  readonly item: DailyBriefingAttentionItem;
  readonly narrative?: { readonly text: string; readonly evidenceKeys: readonly string[] };
}) {
  const href = getAttentionItemHref(item);
  const sourceCount =
    narrative === undefined ? null : formatEvidenceSourceCount(narrative.evidenceKeys);

  const content = (
    <>
      <div className="mission-control-attention-meta">
        <span
          className="mission-control-severity-badge"
          data-severity={item.severity}
        >
          {formatMissionControlSeverity(item.severity)}
        </span>
        <span className="mission-control-type-label">{formatAttentionType(item.type)}</span>
      </div>
      <div className="mission-control-attention-body">
        <strong className="mission-control-item-title">{item.title}</strong>
        <p className="mission-control-item-reason">{item.reason}</p>
        {item.dueDate !== undefined ? (
          <p className="mission-control-item-details">
            Due {formatOptionalMissionControlDate(item.dueDate)}
          </p>
        ) : null}
        {narrative !== undefined ? (
          <p className="daily-briefing-narrative-secondary">{narrative.text}</p>
        ) : null}
        {sourceCount !== null ? (
          <p className="daily-briefing-source-count">{sourceCount}</p>
        ) : null}
      </div>
    </>
  );

  if (href === null) {
    return <li className="mission-control-attention-item">{content}</li>;
  }

  return (
    <li className="mission-control-attention-item">
      <Link className="mission-control-item-link" href={href}>
        {content}
      </Link>
    </li>
  );
}

function attentionItemKey(item: DailyBriefingAttentionItem): string {
  return `${item.type}:${item.entity.entityType}:${item.entity.entityId}`;
}
