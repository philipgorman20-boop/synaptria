import type { MilestoneStatus } from '@synaptria/domain/milestones';

import { formatMilestoneStatus } from '../../../../../lib/milestones-format';

export interface MilestoneStatusBadgeProps {
  readonly status: MilestoneStatus;
}

export function MilestoneStatusBadge({ status }: MilestoneStatusBadgeProps) {
  return (
    <span className="program-badge program-status-badge" data-status={status}>
      {formatMilestoneStatus(status)}
    </span>
  );
}
