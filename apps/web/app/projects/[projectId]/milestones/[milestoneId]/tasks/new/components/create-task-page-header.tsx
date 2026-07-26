import type { Milestone } from '@synaptria/domain/milestones';
import type { Project } from '@synaptria/domain/projects';
import Link from 'next/link';

import {
  buildTaskDetailBreadcrumbLinks,
  getMilestoneTasksListHref,
} from '../../../../../../../../lib/tasks-format';

export const CREATE_TASK_PAGE_TITLE = 'Create task';

export interface CreateTaskPageHeaderProps {
  readonly project: Project;
  readonly milestone: Milestone;
}

export function CreateTaskPageHeader({
  project,
  milestone,
}: CreateTaskPageHeaderProps) {
  const breadcrumbs = buildTaskDetailBreadcrumbLinks({
    projectId: project.id,
    projectName: project.name,
    milestoneId: milestone.id,
    milestoneName: milestone.name,
  });

  return (
    <header className="program-detail-header">
      <nav aria-label="Task navigation" className="program-detail-nav">
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
        <Link href={breadcrumbs.milestoneHref}>{breadcrumbs.milestoneLabel}</Link>
        <span aria-hidden="true" className="program-detail-nav-separator">
          /
        </span>
        <Link href={breadcrumbs.tasksHref}>Tasks</Link>
        <span aria-hidden="true" className="program-detail-nav-separator">
          /
        </span>
        <span aria-current="page">New task</span>
      </nav>

      <div className="program-detail-heading">
        <div className="program-detail-title-group">
          <p className="eyebrow">TASK</p>
          <h1>{CREATE_TASK_PAGE_TITLE}</h1>
          <p className="program-detail-description">
            Add actionable work to {milestone.name} in {project.name}.
          </p>
        </div>
      </div>

      <div className="program-detail-nav">
        <Link
          className="secondary-button"
          href={getMilestoneTasksListHref(project.id, milestone.id)}
        >
          Back to tasks
        </Link>
      </div>
    </header>
  );
}
