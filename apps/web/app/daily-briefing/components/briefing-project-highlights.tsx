import type {
  DailyBriefingNarrative,
  DailyBriefingProjectHighlight,
} from '@synaptria/application';
import Link from 'next/link';

import { PROJECT_HIGHLIGHTS_HEADING } from './daily-briefing-ui-constants';
import {
  DAILY_BRIEFING_EMPTY_HIGHLIGHTS_MESSAGE,
  findNarrativeForEvidenceKey,
  formatEvidenceSourceCount,
  formatMissionControlSeverity,
  formatOptionalMissionControlDate,
  formatProjectHealthState,
  getDailyBriefingProjectHref,
  projectHighlightEvidenceKey,
} from '../daily-briefing-format';

export interface DailyBriefingProjectHighlightsProps {
  readonly projects: readonly DailyBriefingProjectHighlight[];
  readonly narrative: DailyBriefingNarrative | null;
}

export function DailyBriefingProjectHighlights({
  projects,
  narrative,
}: DailyBriefingProjectHighlightsProps) {
  return (
    <section
      className="mission-control-panel"
      aria-labelledby="daily-briefing-highlights-heading"
    >
      <div className="mission-control-panel-header">
        <h2 id="daily-briefing-highlights-heading">{PROJECT_HIGHLIGHTS_HEADING}</h2>
        <p className="mission-control-panel-description">
          Project health, severity, and execution risk indicators.
        </p>
      </div>

      {projects.length === 0 ? (
        <p className="mission-control-empty-state">{DAILY_BRIEFING_EMPTY_HIGHLIGHTS_MESSAGE}</p>
      ) : (
        <ul className="mission-control-health-list daily-briefing-highlight-list">
          {projects.map((project) => {
            const matchedNarrative =
              narrative === null
                ? undefined
                : findNarrativeForEvidenceKey(
                    narrative.projectHighlightItems,
                    projectHighlightEvidenceKey(project),
                  );

            return (
              <DailyBriefingProjectHighlightRow
                key={project.projectId}
                project={project}
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

function DailyBriefingProjectHighlightRow({
  project,
  narrative,
}: {
  readonly project: DailyBriefingProjectHighlight;
  readonly narrative?: { readonly text: string; readonly evidenceKeys: readonly string[] };
}) {
  const sourceCount =
    narrative === undefined ? null : formatEvidenceSourceCount(narrative.evidenceKeys);

  return (
    <li className="mission-control-health-item daily-briefing-highlight-item">
      <Link
        className="mission-control-item-link"
        href={getDailyBriefingProjectHref(project)}
      >
        <div className="mission-control-health-meta">
          <span
            className="mission-control-health-badge"
            data-health={project.healthState}
          >
            {formatProjectHealthState(project.healthState)}
          </span>
          <span className="mission-control-severity-badge" data-severity={project.attentionSeverity}>
            {formatMissionControlSeverity(project.attentionSeverity)}
          </span>
        </div>
        <strong className="mission-control-item-title">{project.projectName}</strong>
        <p className="mission-control-item-context">
          {project.overdueTasks} overdue tasks · {project.blockedTasks} blocked ·{' '}
          {project.recentEventCount} recent events
        </p>
        <p className="mission-control-item-details">
          Next milestone {formatOptionalMissionControlDate(project.nextMilestoneDueDate)}
        </p>
        {narrative !== undefined ? (
          <p className="daily-briefing-narrative-secondary">{narrative.text}</p>
        ) : null}
        {sourceCount !== null ? (
          <p className="daily-briefing-source-count">{sourceCount}</p>
        ) : null}
      </Link>
    </li>
  );
}
