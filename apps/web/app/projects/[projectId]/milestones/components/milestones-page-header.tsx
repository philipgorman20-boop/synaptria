import type { Project } from '@synaptria/domain/projects';
import Link from 'next/link';

import {
  getNewMilestoneHref,
  getProjectDetailHrefFromMilestones,
  getProjectMilestonesListHref,
} from '../../../../../lib/milestones-format';

export interface MilestonesPageHeaderProps {
  readonly project: Project;
  readonly milestoneCount: number;
  readonly canManageMilestones: boolean;
}

export function MilestonesPageHeader({
  project,
  milestoneCount,
  canManageMilestones,
}: MilestonesPageHeaderProps) {
  return (
    <header className="programs-page-header">
      <div className="programs-page-heading">
        <nav aria-label="Milestone navigation" className="program-detail-nav">
          <Link className="program-detail-back-link" href={getProjectDetailHrefFromMilestones(project.id)}>
            {project.name}
          </Link>
          <span aria-hidden="true" className="program-detail-nav-separator">
            /
          </span>
          <Link
            aria-current="page"
            href={getProjectMilestonesListHref(project.id)}
          >
            Milestones
          </Link>
        </nav>
        <p className="eyebrow">EXECUTION</p>
        <h1>Milestones</h1>
        <p>
          Delivery checkpoints and phase gates for {project.name}.
        </p>
        <p className="programs-page-count" aria-live="polite">
          {milestoneCount === 1 ? '1 milestone' : `${milestoneCount} milestones`}
        </p>
      </div>

      <div className="programs-page-actions">
        {canManageMilestones ? (
          <Link className="primary-button" href={getNewMilestoneHref(project.id)}>
            New milestone
          </Link>
        ) : null}
      </div>
    </header>
  );
}
