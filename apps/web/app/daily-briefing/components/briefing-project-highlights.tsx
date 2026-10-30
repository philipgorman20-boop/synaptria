import type { DailyBriefingProjectHighlight } from '@synaptria/application';
import Link from 'next/link';
import { Suspense } from 'react';

import type { DailyBriefingNarrativeResult } from '../../../lib/daily-briefing-loader';
import { PROJECT_HIGHLIGHTS_HEADING } from './daily-briefing-ui-constants';
import { DailyBriefingGroundedItemNarrative } from './daily-briefing-narrative-stream';
import {
  DAILY_BRIEFING_EMPTY_HIGHLIGHTS_MESSAGE,
  formatMissionControlSeverity,
  formatOptionalMissionControlDate,
  formatProjectHealthState,
  getDailyBriefingProjectHref,
  projectHighlightEvidenceKey,
} from '../daily-briefing-format';

export interface DailyBriefingProjectHighlightsProps {
  readonly projects: readonly DailyBriefingProjectHighlight[];
  readonly narrativePromise?: Promise<DailyBriefingNarrativeResult>;
}

export function DailyBriefingProjectHighlights({
  projects,
  narrativePromise,
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
          {projects.map((project) => (
            <DailyBriefingProjectHighlightRow
              key={project.projectId}
              project={project}
              {...(narrativePromise === undefined ? {} : { narrativePromise })}
            />
          ))}
        </ul>
      )}
    </section>
  );
}

function DailyBriefingProjectHighlightRow({
  project,
  narrativePromise,
}: {
  readonly project: DailyBriefingProjectHighlight;
  readonly narrativePromise?: Promise<DailyBriefingNarrativeResult>;
}) {
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
        {narrativePromise === undefined ? null : (
          <Suspense fallback={null}>
            <DailyBriefingGroundedItemNarrative
              narrativePromise={narrativePromise}
              evidenceKey={projectHighlightEvidenceKey(project)}
              items="projectHighlightItems"
            />
          </Suspense>
        )}
      </Link>
    </li>
  );
}
