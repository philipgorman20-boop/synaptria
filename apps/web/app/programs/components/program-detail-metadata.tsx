import type { Program } from '@synaptria/domain/programs';

import { formatProgramDate, formatProgramPriority, formatProgramStatus } from '../programs-format';

export interface ProgramDetailMetadataProps {
  readonly program: Program;
}

export function ProgramDetailMetadata({ program }: ProgramDetailMetadataProps) {
  return (
    <section
      aria-labelledby="program-detail-metadata-heading"
      className="program-detail-metadata"
    >
      <h2 id="program-detail-metadata-heading">Program details</h2>

      <dl className="program-detail-metadata-list">
        <div className="program-card-detail">
          <dt>Status</dt>
          <dd>{formatProgramStatus(program.status)}</dd>
        </div>
        <div className="program-card-detail">
          <dt>Priority</dt>
          <dd>{formatProgramPriority(program.priority)}</dd>
        </div>
        {program.indication !== undefined ? (
          <div className="program-card-detail">
            <dt>Indication</dt>
            <dd>{program.indication}</dd>
          </div>
        ) : null}
        {program.modality !== undefined ? (
          <div className="program-card-detail">
            <dt>Modality</dt>
            <dd>{program.modality}</dd>
          </div>
        ) : null}
        {program.target !== undefined ? (
          <div className="program-card-detail">
            <dt>Target</dt>
            <dd>{program.target}</dd>
          </div>
        ) : null}
        {program.startDate !== undefined ? (
          <div className="program-card-detail">
            <dt>Start date</dt>
            <dd>{formatProgramDate(program.startDate)}</dd>
          </div>
        ) : null}
        {program.targetEndDate !== undefined ? (
          <div className="program-card-detail">
            <dt>Target end date</dt>
            <dd>{formatProgramDate(program.targetEndDate)}</dd>
          </div>
        ) : null}
        {program.completedAt !== undefined ? (
          <div className="program-card-detail">
            <dt>Completed date</dt>
            <dd>{formatProgramDate(program.completedAt)}</dd>
          </div>
        ) : null}
        <div className="program-card-detail">
          <dt>Created</dt>
          <dd>{formatProgramDate(program.createdAt)}</dd>
        </div>
        <div className="program-card-detail">
          <dt>Updated</dt>
          <dd>{formatProgramDate(program.updatedAt)}</dd>
        </div>
      </dl>
    </section>
  );
}
