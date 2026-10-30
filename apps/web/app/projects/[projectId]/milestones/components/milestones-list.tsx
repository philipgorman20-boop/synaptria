import type { Milestone } from '@synaptria/domain/milestones';
import type { ProjectId } from '@synaptria/core';
import Link from 'next/link';

import {
  formatOptionalMilestoneDate,
  getMilestoneDetailHref,
} from '../../../../../lib/milestones-format';

import { MilestonePriorityBadge } from './milestone-priority-badge';
import { MilestoneStatusBadge } from './milestone-status-badge';

export const MILESTONE_TABLE_COLUMNS = [
  'Milestone',
  'Status',
  'Priority',
  'Planned end',
  'Actual end',
] as const;

export interface MilestonesListProps {
  readonly projectId: ProjectId;
  readonly milestones: readonly Milestone[];
}

export function MilestonesList({ projectId, milestones }: MilestonesListProps) {
  return (
    <div className="programs-table-wrapper">
      <table className="programs-table" aria-label="Project milestones">
        <thead>
          <tr>
            {MILESTONE_TABLE_COLUMNS.map((column) => (
              <th key={column} scope="col">
                {column}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {milestones.map((milestone) => (
            <tr key={milestone.id}>
              <th scope="row">
                <Link
                  className="programs-table-link"
                  href={getMilestoneDetailHref(projectId, milestone.id)}
                >
                  {milestone.name}
                </Link>
              </th>
              <td>
                <MilestoneStatusBadge status={milestone.status} />
              </td>
              <td>
                <MilestonePriorityBadge priority={milestone.priority} />
              </td>
              <td>{formatOptionalMilestoneDate(milestone.plannedEndDate)}</td>
              <td>{formatOptionalMilestoneDate(milestone.actualEndDate)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
