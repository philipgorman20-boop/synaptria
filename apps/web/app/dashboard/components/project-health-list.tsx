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
          <div className="mission-control-table-wrapper">
            <table className="mission-control-table">
              <thead>
                <tr>
                  <th scope="col">Project</th>
                  <th scope="col">Health</th>
                  <th scope="col">Risk</th>
                  <th scope="col">Blocked</th>
                  <th scope="col">Next milestone</th>
                </tr>
              </thead>
              <tbody>
                {visibleProjects.map((project) => (
                  <ProjectHealthRow key={project.projectId} project={project} />
                ))}
              </tbody>
            </table>
          </div>
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

function ProjectHealthRow({
  project,
}: {
  readonly project: MissionControlProjectHealth;
}) {
  const healthLabel = formatProjectHealthState(project.healthState);
  const severityLabel = formatMissionControlSeverity(project.attentionSeverity);
  const riskSummary = formatProjectHealthRiskSummary(project);
  const nextMilestone = formatOptionalMissionControlDate(project.nextMilestoneDueDate);
  const blockedLabel =
    project.blockedTasks === 0
      ? 'None'
      : project.blockedTasks === 1
        ? '1 task'
        : `${project.blockedTasks} tasks`;

  return (
    <tr>
      <td>
        <Link
          className="mission-control-table-link"
          href={getProjectHealthHref(project)}
        >
          {project.projectName}
        </Link>
      </td>
      <td>
        <span
          className="mission-control-health-badge"
          data-health={project.healthState}
        >
          {healthLabel}
        </span>
        <span className="mission-control-health-severity">{severityLabel}</span>
      </td>
      <td>{riskSummary}</td>
      <td>{blockedLabel}</td>
      <td>{nextMilestone}</td>
    </tr>
  );
}
