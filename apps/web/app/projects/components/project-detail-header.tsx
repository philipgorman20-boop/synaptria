import type { Project } from '@synaptria/domain/projects';
import { routes } from '@synaptria/config';
import Link from 'next/link';

import { ProjectPriorityBadge } from './project-priority-badge';
import { ProjectStatusBadge } from './project-status-badge';

export interface ProjectDetailHeaderProps {
  readonly project: Project;
}

export function ProjectDetailHeader({ project }: ProjectDetailHeaderProps) {
  return (
    <header className="program-detail-header">
      <nav aria-label="Project navigation" className="program-detail-nav">
        <Link className="program-detail-back-link" href={routes.projects}>
          Projects
        </Link>
        <span aria-hidden="true" className="program-detail-nav-separator">
          /
        </span>
        <span aria-current="page">{project.name}</span>
      </nav>

      <div className="program-detail-heading">
        <div className="program-detail-title-group">
          <p className="eyebrow">PROJECT</p>
          <h1>{project.name}</h1>
          {project.code !== undefined ? (
            <p className="program-card-code">{project.code}</p>
          ) : null}
          {project.description !== undefined ? (
            <p className="program-detail-description">{project.description}</p>
          ) : null}
        </div>

        <div className="program-card-badges program-detail-badges">
          <ProjectStatusBadge status={project.status} />
          <ProjectPriorityBadge priority={project.priority} />
        </div>
      </div>
    </header>
  );
}
