import type { Milestone } from '@synaptria/domain/milestones';

import {
  formatMilestoneDate,
  formatMilestonePriority,
  formatMilestoneStatus,
  formatOptionalMilestoneDate,
} from '../../../../../../lib/milestones-format';

export const MILESTONE_DETAIL_METADATA_HEADING = 'Milestone details';
export const MILESTONE_READ_ONLY_NOTICE =
  'Editing milestones is not available yet. This page is read-only.';

export interface MilestoneDetailMetadataProps {
  readonly milestone: Milestone;
}

export function MilestoneDetailMetadata({ milestone }: MilestoneDetailMetadataProps) {
  return (
    <section
      aria-labelledby="milestone-detail-metadata-heading"
      className="program-detail-metadata"
    >
      <h2 id="milestone-detail-metadata-heading">{MILESTONE_DETAIL_METADATA_HEADING}</h2>
      <p className="form-help">{MILESTONE_READ_ONLY_NOTICE}</p>

      <dl className="program-detail-metadata-list">
        <div className="program-card-detail">
          <dt>Status</dt>
          <dd>{formatMilestoneStatus(milestone.status)}</dd>
        </div>
        <div className="program-card-detail">
          <dt>Priority</dt>
          <dd>{formatMilestonePriority(milestone.priority)}</dd>
        </div>
        <div className="program-card-detail">
          <dt>Planned start</dt>
          <dd>{formatOptionalMilestoneDate(milestone.plannedStartDate)}</dd>
        </div>
        <div className="program-card-detail">
          <dt>Planned end</dt>
          <dd>{formatOptionalMilestoneDate(milestone.plannedEndDate)}</dd>
        </div>
        <div className="program-card-detail">
          <dt>Actual start</dt>
          <dd>{formatOptionalMilestoneDate(milestone.actualStartDate)}</dd>
        </div>
        <div className="program-card-detail">
          <dt>Actual end</dt>
          <dd>{formatOptionalMilestoneDate(milestone.actualEndDate)}</dd>
        </div>
        <div className="program-card-detail">
          <dt>Created</dt>
          <dd>{formatMilestoneDate(milestone.createdAt)}</dd>
        </div>
        <div className="program-card-detail">
          <dt>Updated</dt>
          <dd>{formatMilestoneDate(milestone.updatedAt)}</dd>
        </div>
      </dl>
    </section>
  );
}
