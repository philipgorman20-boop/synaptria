import type { ProgramPriority } from '@synaptria/domain/programs';

import { formatProgramPriority } from '../programs-format';

export interface ProgramPriorityBadgeProps {
  readonly priority: ProgramPriority;
}

export function ProgramPriorityBadge({ priority }: ProgramPriorityBadgeProps) {
  return (
    <span className="program-badge program-priority-badge" data-priority={priority}>
      {formatProgramPriority(priority)}
    </span>
  );
}
