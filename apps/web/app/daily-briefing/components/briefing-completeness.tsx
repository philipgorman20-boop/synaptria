import type { DailyBriefingNarrative, DailyBriefingSnapshot } from '@synaptria/application';

import { RestrictedDataNotice } from '../../dashboard/components/restricted-data-notice';
import { COMPLETENESS_HEADING } from './daily-briefing-ui-constants';
import {
  formatCompletenessStatus,
  formatRestrictedSlicesForBriefing,
} from '../daily-briefing-format';

export interface DailyBriefingCompletenessPanelProps {
  readonly snapshot: DailyBriefingSnapshot;
  readonly narrative: DailyBriefingNarrative | null;
}

export function DailyBriefingCompletenessPanel({
  snapshot,
  narrative,
}: DailyBriefingCompletenessPanelProps) {
  const { completeness, metadata } = snapshot;
  const showRestricted = metadata.restrictedSlices.length > 0;
  const showDegradationNotes = completeness.degradationNotes.length > 0;
  const completenessNote = narrative?.completenessNote;

  if (
    completeness.status === 'complete' &&
    !showRestricted &&
    !showDegradationNotes &&
    completenessNote === undefined
  ) {
    return null;
  }

  return (
    <section
      className="mission-control-panel daily-briefing-completeness-panel"
      aria-labelledby="daily-briefing-completeness-heading"
    >
      <div className="mission-control-panel-header">
        <h2 id="daily-briefing-completeness-heading">{COMPLETENESS_HEADING}</h2>
      </div>

      <p className="daily-briefing-completeness-status">
        Status: <strong>{formatCompletenessStatus(completeness.status)}</strong>
      </p>

      {showRestricted ? (
        <div className="daily-briefing-restricted-wrap">
          <RestrictedDataNotice restrictedSlices={metadata.restrictedSlices} />
          <p className="daily-briefing-restricted-detail">
            Restricted areas: {formatRestrictedSlicesForBriefing(metadata.restrictedSlices)}.
          </p>
        </div>
      ) : null}

      {showDegradationNotes ? (
        <ul className="daily-briefing-degradation-notes">
          {completeness.degradationNotes.map((note) => (
            <li key={note}>{note}</li>
          ))}
        </ul>
      ) : null}

      {completenessNote !== undefined ? (
        <aside className="daily-briefing-completeness-note" aria-label="AI completeness note">
          <p className="daily-briefing-note-label">AI note</p>
          <p className="daily-briefing-narrative-secondary">{completenessNote}</p>
        </aside>
      ) : null}
    </section>
  );
}
