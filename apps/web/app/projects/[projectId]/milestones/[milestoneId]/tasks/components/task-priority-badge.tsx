import type { Priority } from '@synaptria/domain/shared';

import { formatTaskPriority } from '../../../../../../../lib/tasks-format';

export interface TaskPriorityBadgeProps {
  readonly priority: Priority;
}

export function TaskPriorityBadge({ priority }: TaskPriorityBadgeProps) {
  return (
    <span className="program-badge program-priority-badge" data-priority={priority}>
      {formatTaskPriority(priority)}
    </span>
  );
}
