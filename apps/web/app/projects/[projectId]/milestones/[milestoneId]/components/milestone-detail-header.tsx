import type { Milestone } from '@synaptria/domain/milestones';
import type { Project } from '@synaptria/domain/projects';
import Link from 'next/link';

import { buildMilestoneDetailBreadcrumbLinks } from '../../../../../../lib/milestones-format';

import { MilestonePriorityBadge } from '../../components/milestone-priority-badge';
import { MilestoneStatusBadge } from '../../components/milestone-status-badge';

export interface MilestoneDetailHeaderProps {
  readonly project: Project;
  readonly milestone: Milestone;
}

export function MilestoneDetailHeader({
  project,
  milestone,
}: MilestoneDetailHeaderProps) {
  const breadcrumbs = buildMilestoneDetailBreadcrumbLinks({
    projectId: project.id,
    projectName: project.name,
    milestoneName: milestone.name,
  });

  return (
    <header className="program-detail-header">
      <nav aria-label="Milestone navigation" className="program-detail-nav">
        <Link className="program-detail-back-link" href={breadcrumbs.projectHref}>
          {breadcrumbs.projectLabel}
        </Link>
        <span aria-hidden="true" className="program-detail-nav-separator">
          /
        </span>
        <Link href={breadcrumbs.milestonesHref}>Milestones</Link>
        <span aria-hidden="true" className="program-detail-nav-separator">
          /
        </span>
        <span aria-current="page">{milestone.name}</span>
      </nav>

      <div className="program-detail-heading">
        <div className="program-detail-title-group">
          <p className="eyebrow">MILESTONE</p>
          <h1>{milestone.name}</h1>
          {milestone.description !== undefined ? (
            <p className="program-detail-description">{milestone.description}</p>
          ) : null}
        </div>

        <div className="program-card-badges program-detail-badges">
          <MilestoneStatusBadge status={milestone.status} />
          <MilestonePriorityBadge priority={milestone.priority} />
        </div>
      </div>

      <div className="program-detail-nav">
        <Link className="secondary-button" href={breadcrumbs.milestonesHref}>
          Back to milestones
        </Link>
      </div>
    </header>
  );
}
