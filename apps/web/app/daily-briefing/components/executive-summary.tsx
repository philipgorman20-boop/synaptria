import type { GroundedNarrativeBlock } from '@synaptria/application';

import { EXECUTIVE_SUMMARY_HEADING } from './daily-briefing-ui-constants';
import { formatEvidenceSourceCount } from '../daily-briefing-format';

export interface DailyBriefingExecutiveSummaryProps {
  readonly summary: GroundedNarrativeBlock | null;
}

export function DailyBriefingExecutiveSummary({
  summary,
}: DailyBriefingExecutiveSummaryProps) {
  if (summary === null) {
    return null;
  }

  const sourceCount = formatEvidenceSourceCount(summary.evidenceKeys);

  return (
    <section
      className="mission-control-panel daily-briefing-summary-panel"
      aria-labelledby="daily-briefing-summary-heading"
    >
      <div className="mission-control-panel-header">
        <h2 id="daily-briefing-summary-heading">{EXECUTIVE_SUMMARY_HEADING}</h2>
      </div>
      <p className="daily-briefing-narrative-text">{summary.text}</p>
      {sourceCount !== null ? (
        <p className="daily-briefing-source-count">{sourceCount}</p>
      ) : null}
    </section>
  );
}
