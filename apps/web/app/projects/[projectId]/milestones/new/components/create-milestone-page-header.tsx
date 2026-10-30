import type { Project } from '@synaptria/domain/projects';
import Link from 'next/link';

import {
  buildMilestoneDetailBreadcrumbLinks,
  getProjectMilestonesListHref,
} from '../../../../../../lib/milestones-format';

export const CREATE_MILESTONE_PAGE_TITLE = 'Create milestone';

export interface CreateMilestonePageHeaderProps {
  readonly project: Project;
}

export function CreateMilestonePageHeader({ project }: CreateMilestonePageHeaderProps) {
  const breadcrumbs = buildMilestoneDetailBreadcrumbLinks({
    projectId: project.id,
    projectName: project.name,
  });

  return (
    <header className="program-detail-header">
      <nav aria-label="Milestone navigation" className="program-detail-nav">
        <Link className="program-detail-back-link" href={breadcrumbs.projectHref}>
          {breadcrumbs.projectLabel}
        </Link>
        <span aria-hidden="true" className="program-detail-nav-separator">
          /
        </span>
        <Link href={breadcrumbs.milestonesHref}>Milestones</Link>
        <span aria-hidden="true" className="program-detail-nav-separator">
          /
        </span>
        <span aria-current="page">New milestone</span>
      </nav>

      <div className="program-detail-heading">
        <div className="program-detail-title-group">
          <p className="eyebrow">MILESTONE</p>
          <h1>{CREATE_MILESTONE_PAGE_TITLE}</h1>
          <p className="program-detail-description">
            Add a delivery checkpoint or phase gate to {project.name}.
          </p>
        </div>
      </div>

      <div className="program-detail-nav">
        <Link className="secondary-button" href={getProjectMilestonesListHref(project.id)}>
          Back to milestones
        </Link>
      </div>
    </header>
  );
}
