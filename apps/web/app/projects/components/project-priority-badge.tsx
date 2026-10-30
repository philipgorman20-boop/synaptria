import type { ProjectPriority } from '@synaptria/domain/projects';

import { formatProjectPriority } from '../projects-format';

export interface ProjectPriorityBadgeProps {
  readonly priority: ProjectPriority;
}

export function ProjectPriorityBadge({ priority }: ProjectPriorityBadgeProps) {
  return (
    <span className="program-badge program-priority-badge" data-priority={priority}>
      {formatProjectPriority(priority)}
    </span>
  );
}
