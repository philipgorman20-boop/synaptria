import type { ProgramStatus } from '@synaptria/domain/programs';

import { formatProgramStatus } from '../programs-format';

export interface ProgramStatusBadgeProps {
  readonly status: ProgramStatus;
}

export function ProgramStatusBadge({ status }: ProgramStatusBadgeProps) {
  return (
    <span className="program-badge program-status-badge" data-status={status}>
      {formatProgramStatus(status)}
    </span>
  );
}
