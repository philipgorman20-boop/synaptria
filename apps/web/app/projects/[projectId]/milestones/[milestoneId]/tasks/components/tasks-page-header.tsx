import type { Milestone } from '@synaptria/domain/milestones';
import type { Project } from '@synaptria/domain/projects';
import Link from 'next/link';

import {
  buildTaskDetailBreadcrumbLinks,
  getNewTaskHref,
} from '../../../../../../../lib/tasks-format';

export interface TasksPageHeaderProps {
  readonly project: Project;
  readonly milestone: Milestone;
  readonly taskCount: number;
  readonly canManageTasks: boolean;
}

export function TasksPageHeader({
  project,
  milestone,
  taskCount,
  canManageTasks,
}: TasksPageHeaderProps) {
  const breadcrumbs = buildTaskDetailBreadcrumbLinks({
    projectId: project.id,
    projectName: project.name,
    milestoneId: milestone.id,
    milestoneName: milestone.name,
  });

  return (
    <header className="programs-page-header">
      <div className="programs-page-heading">
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
          <span aria-current="page">Tasks</span>
        </nav>
        <p className="eyebrow">EXECUTION</p>
        <h1>Tasks</h1>
        <p>
          Work items for {milestone.name} in {project.name}.
        </p>
        <p className="programs-page-count" aria-live="polite">
          {taskCount === 1 ? '1 task' : `${taskCount} tasks`}
        </p>
      </div>

      <div className="programs-page-actions">
        {canManageTasks ? (
          <Link
            className="primary-button"
            href={getNewTaskHref(project.id, milestone.id)}
          >
            New task
          </Link>
        ) : null}
      </div>
    </header>
  );
}
