import type { MissionControlProjectHealth } from '@synaptria/application/mission-control';
import { routes } from '@synaptria/config';
import Link from 'next/link';

import { PROJECT_HEALTH_HEADING } from './mission-control-ui-constants';
import {
  formatMissionControlSeverity,
  formatOptionalMissionControlDate,
  formatProjectHealthRiskSummary,
  formatProjectHealthState,
  getProjectHealthHref,
  getProjectHealthOverflowCount,
  MISSION_CONTROL_EMPTY_PROJECT_HEALTH_MESSAGE,
  MISSION_CONTROL_PROJECT_HEALTH_LIMIT,
  shouldShowProjectHealthSeverity,
} from '../mission-control-format';

export interface ProjectHealthListProps {
  readonly projectHealth: readonly MissionControlProjectHealth[];
}

export function ProjectHealthList({ projectHealth }: ProjectHealthListProps) {
  const visibleProjects = projectHealth.slice(0, MISSION_CONTROL_PROJECT_HEALTH_LIMIT);
  const overflowCount = getProjectHealthOverflowCount(projectHealth);

  return (
    <section
      className="mission-control-panel"
      aria-labelledby="mission-control-health-heading"
    >
      <div className="mission-control-panel-header">
        <h2 id="mission-control-health-heading">{PROJECT_HEALTH_HEADING}</h2>
        <p className="mission-control-panel-description">
          Active project execution status and risk indicators.
        </p>
      </div>

      {visibleProjects.length === 0 ? (
        <p className="mission-control-empty-state">
          {MISSION_CONTROL_EMPTY_PROJECT_HEALTH_MESSAGE}
        </p>
      ) : (
        <>
          <ul className="mission-control-project-health-list">
            {visibleProjects.map((project) => (
              <ProjectHealthItem key={project.projectId} project={project} />
            ))}
          </ul>
          {overflowCount > 0 ? (
            <p className="mission-control-panel-footer">
              {overflowCount} more project{overflowCount === 1 ? '' : 's'} not shown.{' '}
              <Link className="mission-control-inline-link" href={routes.projects}>
                View all projects
              </Link>
            </p>
          ) : null}
        </>
      )}
    </section>
  );
}

function ProjectHealthItem({
  project,
}: {
  readonly project: MissionControlProjectHealth;
}) {
  const healthLabel = formatProjectHealthState(project.healthState);
  const riskSummary = formatProjectHealthRiskSummary(project);
  const nextMilestone = formatOptionalMissionControlDate(project.nextMilestoneDueDate);
  const showSeverity = shouldShowProjectHealthSeverity(project);

  return (
    <li className="mission-control-project-health-item">
      <div className="mission-control-project-health-header">
        <Link
          className="mission-control-project-health-link"
          href={getProjectHealthHref(project)}
        >
          {project.projectName}
        </Link>
        <div className="mission-control-project-health-badges">
          {showSeverity ? (
            <span className="mission-control-project-health-severity">
              {formatMissionControlSeverity(project.attentionSeverity)}
            </span>
          ) : null}
          <span
            className="mission-control-health-badge"
            data-health={project.healthState}
          >
            {healthLabel}
          </span>
        </div>
      </div>
      <p className="mission-control-project-health-risk">{riskSummary}</p>
      <p className="mission-control-project-health-next">
        Next milestone: {nextMilestone}
      </p>
    </li>
  );
}
