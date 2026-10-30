import type { Task } from '@synaptria/domain/tasks';
import type { MilestoneId, ProjectId } from '@synaptria/core';
import Link from 'next/link';

import {
  formatOptionalTaskDate,
  getTaskDetailHref,
} from '../../../../../../../lib/tasks-format';

import { TaskPriorityBadge } from './task-priority-badge';
import { TaskStatusBadge } from './task-status-badge';

export const TASK_TABLE_COLUMNS = [
  'Task',
  'Status',
  'Priority',
  'Planned end',
  'Actual end',
] as const;

export interface TasksListProps {
  readonly projectId: ProjectId;
  readonly milestoneId: MilestoneId;
  readonly tasks: readonly Task[];
}

export function TasksList({ projectId, milestoneId, tasks }: TasksListProps) {
  return (
    <div className="programs-table-wrapper">
      <table className="programs-table" aria-label="Milestone tasks">
        <thead>
          <tr>
            {TASK_TABLE_COLUMNS.map((column) => (
              <th key={column} scope="col">
                {column}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {tasks.map((task) => (
            <tr key={task.id}>
              <th scope="row">
                <Link
                  className="programs-table-link"
                  href={getTaskDetailHref(projectId, milestoneId, task.id)}
                >
                  {task.name}
                </Link>
              </th>
              <td>
                <TaskStatusBadge status={task.status} />
              </td>
              <td>
                <TaskPriorityBadge priority={task.priority} />
              </td>
              <td>{formatOptionalTaskDate(task.plannedEndDate)}</td>
              <td>{formatOptionalTaskDate(task.actualEndDate)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
