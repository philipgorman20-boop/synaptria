import type { Project } from '@synaptria/domain/projects';
import { Card, Stack } from '@synaptria/ui';
import Link from 'next/link';

import {
  formatProjectDate,
  formatProjectPercentComplete,
  formatProjectProgramAssociation,
  getProjectDetailHref,
} from '../projects-format';

import { ProjectPriorityBadge } from './project-priority-badge';
import { ProjectStatusBadge } from './project-status-badge';

export interface ProjectCardProps {
  readonly project: Project;
}

export function ProjectCard({ project }: ProjectCardProps) {
  return (
    <Link
      className="program-card-link"
      href={getProjectDetailHref(project.id)}
    >
      <Card className="program-card">
        <Stack gap={12}>
          <div className="program-card-header">
            <div className="program-card-title-group">
              <h2 className="program-card-title">{project.name}</h2>
              {project.code !== undefined ? (
                <p className="program-card-code">{project.code}</p>
              ) : null}
            </div>
            <div className="program-card-badges">
              <ProjectStatusBadge status={project.status} />
              <ProjectPriorityBadge priority={project.priority} />
            </div>
          </div>

          <dl className="program-card-details">
            <div className="program-card-detail">
              <dt>Progress</dt>
              <dd>{formatProjectPercentComplete(project.percentComplete)}</dd>
            </div>
            <div className="program-card-detail">
              <dt>Scope</dt>
              <dd>{formatProjectProgramAssociation(project.programId)}</dd>
            </div>
            {project.targetEndDate !== undefined ? (
              <div className="program-card-detail">
                <dt>Target end</dt>
                <dd>{formatProjectDate(project.targetEndDate)}</dd>
              </div>
            ) : null}
          </dl>
        </Stack>
      </Card>
    </Link>
  );
}
