import type { DailyBriefingSnapshot } from '@synaptria/application';
import { Suspense, type ReactNode } from 'react';

import { RestrictedDataNotice } from '../../dashboard/components/restricted-data-notice';
import { COMPLETENESS_HEADING } from './daily-briefing-ui-constants';
import { DailyBriefingCompletenessNoteContent } from './daily-briefing-narrative-stream';
import type { DailyBriefingNarrativeResult } from '../../../lib/daily-briefing-loader';
import {
  formatCompletenessStatus,
  formatRestrictedSlicesForBriefing,
} from '../daily-briefing-format';

export interface DailyBriefingCompletenessPanelProps {
  readonly snapshot: DailyBriefingSnapshot;
  readonly narrativePromise?: Promise<DailyBriefingNarrativeResult>;
  readonly completenessNoteSlot?: ReactNode;
}

export function DailyBriefingCompletenessPanel({
  snapshot,
  narrativePromise,
  completenessNoteSlot,
}: DailyBriefingCompletenessPanelProps) {
  const { completeness, metadata } = snapshot;
  const showRestricted = metadata.restrictedSlices.length > 0;
  const showDegradationNotes = completeness.degradationNotes.length > 0;
  const streamingNoteSlot =
    narrativePromise === undefined
      ? completenessNoteSlot
      : (
          <Suspense fallback={null}>
            <DailyBriefingCompletenessNoteContent narrativePromise={narrativePromise} />
          </Suspense>
        );

  if (
    completeness.status === 'complete' &&
    !showRestricted &&
    !showDegradationNotes &&
    narrativePromise === undefined &&
    completenessNoteSlot === undefined
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

      {streamingNoteSlot ?? null}
    </section>
  );
}
