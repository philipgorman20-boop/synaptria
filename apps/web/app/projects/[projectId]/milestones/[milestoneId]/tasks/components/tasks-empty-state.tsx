import type { MilestoneId, ProjectId } from '@synaptria/core';
import Link from 'next/link';

import { getNewTaskHref } from '../../../../../../../lib/tasks-format';

export interface TasksEmptyStateProps {
  readonly projectId: ProjectId;
  readonly milestoneId: MilestoneId;
  readonly canManageTasks: boolean;
}

export function TasksEmptyState({
  projectId,
  milestoneId,
  canManageTasks,
}: TasksEmptyStateProps) {
  return (
    <section
      className="programs-empty-state"
      aria-labelledby="tasks-empty-heading"
    >
      <p className="eyebrow">EXECUTION</p>
      <h2 id="tasks-empty-heading">No tasks yet</h2>
      <p>
        Tasks track actionable work within this milestone. When tasks are created,
        they will appear here.
      </p>
      {canManageTasks ? (
        <div className="programs-empty-state-actions">
          <Link
            className="primary-button"
            href={getNewTaskHref(projectId, milestoneId)}
          >
            Create your first task
          </Link>
        </div>
      ) : null}
    </section>
  );
}
