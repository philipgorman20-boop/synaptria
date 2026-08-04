import type { ProjectId } from '@synaptria/core';
import Link from 'next/link';

import { getNewMilestoneHref } from '../../../../../lib/milestones-format';

export interface MilestonesEmptyStateProps {
  readonly projectId: ProjectId;
  readonly canManageMilestones: boolean;
}

export function MilestonesEmptyState({
  projectId,
  canManageMilestones,
}: MilestonesEmptyStateProps) {
  return (
    <section
      className="programs-empty-state"
      aria-labelledby="milestones-empty-heading"
    >
      <p className="eyebrow">EXECUTION</p>
      <h2 id="milestones-empty-heading">No milestones yet</h2>
      <p>
        Milestones track phase gates and delivery checkpoints for this project.
        When milestones are created, they will appear here.
      </p>
      {canManageMilestones ? (
        <div className="programs-empty-state-actions">
          <Link className="primary-button" href={getNewMilestoneHref(projectId)}>
            Create your first milestone
          </Link>
        </div>
      ) : null}
    </section>
  );
}
