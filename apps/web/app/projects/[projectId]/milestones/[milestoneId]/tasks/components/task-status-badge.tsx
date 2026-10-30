import type { TaskStatus } from '@synaptria/domain/tasks';

import { formatTaskStatus } from '../../../../../../../lib/tasks-format';

export interface TaskStatusBadgeProps {
  readonly status: TaskStatus;
}

export function TaskStatusBadge({ status }: TaskStatusBadgeProps) {
  return (
    <span className="program-badge program-status-badge" data-status={status}>
      {formatTaskStatus(status)}
    </span>
  );
}
