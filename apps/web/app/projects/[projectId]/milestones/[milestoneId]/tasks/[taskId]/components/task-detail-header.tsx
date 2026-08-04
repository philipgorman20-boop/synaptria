import type { Milestone } from '@synaptria/domain/milestones';
import type { Project } from '@synaptria/domain/projects';
import type { Task } from '@synaptria/domain/tasks';
import Link from 'next/link';

import { buildTaskDetailBreadcrumbLinks } from '../../../../../../../../lib/tasks-format';

import { TaskPriorityBadge } from '../../components/task-priority-badge';
import { TaskStatusBadge } from '../../components/task-status-badge';

export interface TaskDetailHeaderProps {
  readonly project: Project;
  readonly milestone: Milestone;
  readonly task: Task;
}

export function TaskDetailHeader({
  project,
  milestone,
  task,
}: TaskDetailHeaderProps) {
  const breadcrumbs = buildTaskDetailBreadcrumbLinks({
    projectId: project.id,
    projectName: project.name,
    milestoneId: milestone.id,
    milestoneName: milestone.name,
    taskName: task.name,
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
        <span aria-current="page">{task.name}</span>
      </nav>

      <div className="program-detail-heading">
        <div className="program-detail-title-group">
          <p className="eyebrow">TASK</p>
          <h1>{task.name}</h1>
          {task.description !== undefined ? (
            <p className="program-detail-description">{task.description}</p>
          ) : null}
        </div>

        <div className="program-card-badges program-detail-badges">
          <TaskStatusBadge status={task.status} />
          <TaskPriorityBadge priority={task.priority} />
        </div>
      </div>

      <div className="program-detail-nav">
        <Link className="secondary-button" href={breadcrumbs.tasksHref}>
          Back to tasks
        </Link>
      </div>
    </header>
  );
}
