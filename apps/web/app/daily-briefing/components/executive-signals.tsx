import type { DailyBriefingSnapshot } from '@synaptria/application';

import {
  DAILY_BRIEFING_EXECUTIVE_SIGNAL_DEFINITIONS,
  formatExecutiveSignalValue,
  isExecutiveSignalUnavailable,
} from '../daily-briefing-format';
import { EXECUTIVE_SIGNALS_HEADING } from './daily-briefing-ui-constants';

export interface DailyBriefingExecutiveSignalsProps {
  readonly snapshot: DailyBriefingSnapshot;
}

export function DailyBriefingExecutiveSignals({
  snapshot,
}: DailyBriefingExecutiveSignalsProps) {
  return (
    <section
      className="daily-briefing-signals"
      aria-labelledby="daily-briefing-signals-heading"
    >
      <h2 id="daily-briefing-signals-heading" className="daily-briefing-section-heading">
        {EXECUTIVE_SIGNALS_HEADING}
      </h2>
      <div className="daily-briefing-signals-grid">
        {DAILY_BRIEFING_EXECUTIVE_SIGNAL_DEFINITIONS.map((definition) => {
          const value = snapshot.executiveSignals[definition.key];
          const unavailable = isExecutiveSignalUnavailable(value);
          const displayValue = formatExecutiveSignalValue(value);

          return (
            <article
              key={definition.key}
              className="mission-control-kpi-card daily-briefing-signal-card"
              aria-label={
                unavailable
                  ? `${definition.label} unavailable due to access permissions`
                  : `${definition.label}: ${displayValue}`
              }
            >
              <span className="mission-control-kpi-label">{definition.label}</span>
              <strong className="mission-control-kpi-value">{displayValue}</strong>
              <span className="mission-control-kpi-context">
                {unavailable ? 'Restricted' : definition.context}
              </span>
            </article>
          );
        })}
      </div>
    </section>
  );
}
