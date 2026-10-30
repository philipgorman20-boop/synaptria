import type { Project } from '@synaptria/domain/projects';
import Link from 'next/link';

import {
  formatProjectDate,
  formatProjectPercentComplete,
  formatProjectPriority,
  formatProjectStatus,
  type ProjectProgramDisplay,
} from '../projects-format';

export interface ProjectDetailMetadataProps {
  readonly project: Project;
  readonly programDisplay: ProjectProgramDisplay;
}

export function ProjectDetailMetadata({
  project,
  programDisplay,
}: ProjectDetailMetadataProps) {
  const progressLabel = `${formatProjectPercentComplete(project.percentComplete)} complete`;

  return (
    <section
      aria-labelledby="project-detail-metadata-heading"
      className="program-detail-metadata"
    >
      <h2 id="project-detail-metadata-heading">Project details</h2>

      <dl className="program-detail-metadata-list">
        <div className="program-card-detail">
          <dt>Status</dt>
          <dd>{formatProjectStatus(project.status)}</dd>
        </div>
        <div className="program-card-detail">
          <dt>Priority</dt>
          <dd>{formatProjectPriority(project.priority)}</dd>
        </div>
        <div className="program-card-detail">
          <dt>Progress</dt>
          <dd className="project-detail-progress">
            <progress
              aria-label={progressLabel}
              max={100}
              value={project.percentComplete}
            />
            <span>{formatProjectPercentComplete(project.percentComplete)}</span>
          </dd>
        </div>
        <div className="program-card-detail">
          <dt>Program</dt>
          <dd>
            {programDisplay.kind === 'linked' ? (
              <Link href={programDisplay.href}>{programDisplay.label}</Link>
            ) : (
              programDisplay.label
            )}
          </dd>
        </div>
        {project.startDate !== undefined ? (
          <div className="program-card-detail">
            <dt>Start date</dt>
            <dd>{formatProjectDate(project.startDate)}</dd>
          </div>
        ) : null}
        {project.targetEndDate !== undefined ? (
          <div className="program-card-detail">
            <dt>Target end date</dt>
            <dd>{formatProjectDate(project.targetEndDate)}</dd>
          </div>
        ) : null}
        {project.completedAt !== undefined ? (
          <div className="program-card-detail">
            <dt>Completed date</dt>
            <dd>{formatProjectDate(project.completedAt)}</dd>
          </div>
        ) : null}
        <div className="program-card-detail">
          <dt>Created</dt>
          <dd>{formatProjectDate(project.createdAt)}</dd>
        </div>
        <div className="program-card-detail">
          <dt>Updated</dt>
          <dd>{formatProjectDate(project.updatedAt)}</dd>
        </div>
      </dl>
    </section>
  );
}
