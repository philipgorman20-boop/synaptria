import type { MissionControlRestrictedSlice, MissionControlSummary } from '@synaptria/application/mission-control';
import Link from 'next/link';

import {
  getKpiValue,
  isSliceRestricted,
  MISSION_CONTROL_KPI_DEFINITIONS,
  type MissionControlKpiKey,
} from '../mission-control-format';

export interface MissionControlKpisProps {
  readonly summary: MissionControlSummary;
  readonly restrictedSlices: readonly MissionControlRestrictedSlice[];
}

export function MissionControlKpis({ summary, restrictedSlices }: MissionControlKpisProps) {
  return (
    <section className="mission-control-kpis" aria-label="Mission Control metrics">
      {MISSION_CONTROL_KPI_DEFINITIONS.map((definition) => (
        <MissionControlKpiCard
          key={definition.key}
          definition={definition}
          summary={summary}
          restricted={
            definition.restrictedSlice === null
              ? false
              : isSliceRestricted(definition.restrictedSlice, restrictedSlices)
          }
        />
      ))}
    </section>
  );
}

interface MissionControlKpiCardProps {
  readonly definition: (typeof MISSION_CONTROL_KPI_DEFINITIONS)[number];
  readonly summary: MissionControlSummary;
  readonly restricted: boolean;
}

function MissionControlKpiCard({
  definition,
  summary,
  restricted,
}: MissionControlKpiCardProps) {
  const value = restricted ? null : getKpiValue(summary, definition.key as MissionControlKpiKey);
  const displayValue = value === null ? '—' : String(value);
  const ariaLabel =
    restricted
      ? `${definition.label} unavailable due to access permissions`
      : `${definition.label}: ${displayValue}`;

  const content = (
    <article className="mission-control-kpi-card" aria-label={ariaLabel}>
      <span className="mission-control-kpi-label">{definition.label}</span>
      <strong className="mission-control-kpi-value">{displayValue}</strong>
      <span className="mission-control-kpi-context">
        {restricted ? 'Restricted' : definition.context}
      </span>
    </article>
  );

  if (definition.href === null || restricted) {
    return content;
  }

  return (
    <Link className="mission-control-kpi-link" href={definition.href}>
      {content}
    </Link>
  );
}
