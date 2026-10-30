import type { ProjectStatus } from '@synaptria/domain/projects';

import { formatProjectStatus } from '../projects-format';

export interface ProjectStatusBadgeProps {
  readonly status: ProjectStatus;
}

export function ProjectStatusBadge({ status }: ProjectStatusBadgeProps) {
  return (
    <span className="program-badge program-status-badge" data-status={status}>
      {formatProjectStatus(status)}
    </span>
  );
}
