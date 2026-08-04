import type { MilestonePriority } from '@synaptria/domain/milestones';

import { formatMilestonePriority } from '../../../../../lib/milestones-format';

export interface MilestonePriorityBadgeProps {
  readonly priority: MilestonePriority;
}

export function MilestonePriorityBadge({ priority }: MilestonePriorityBadgeProps) {
  return (
    <span className="program-badge program-priority-badge" data-priority={priority}>
      {formatMilestonePriority(priority)}
    </span>
  );
}
