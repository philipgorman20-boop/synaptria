import type { Decision } from '@synaptria/domain/decisions';
import type { Program } from '@synaptria/domain/programs';
import type { Project } from '@synaptria/domain/projects';

import { formatDecisionDate, formatDecisionStatus } from '../decisions-format';

export interface DecisionDetailMetadataProps {
  readonly decision: Decision;
  readonly programs: readonly Program[];
  readonly projects: readonly Project[];
}

export function DecisionDetailMetadata({ decision, programs, projects }: DecisionDetailMetadataProps) {
  const linkedProgram = decision.programId !== undefined ? programs.find((p) => p.id === decision.programId) : undefined;
  const linkedProject = decision.projectId !== undefined ? projects.find((p) => p.id === decision.projectId) : undefined;
  return (
    <section aria-labelledby="decision-detail-metadata-heading" className="detail-metadata">
      <h2 id="decision-detail-metadata-heading">Decision details</h2>

      <dl className="detail-metadata-list">
        <div className="detail-field">
          <dt>Status</dt>
          <dd>{formatDecisionStatus(decision.status)}</dd>
        </div>
        {decision.decision !== undefined ? (
          <div className="detail-field detail-field--full">
            <dt>Decision</dt>
            <dd>{decision.decision}</dd>
          </div>
        ) : null}
        {decision.rationale !== undefined ? (
          <div className="detail-field detail-field--full">
            <dt>Rationale</dt>
            <dd>{decision.rationale}</dd>
          </div>
        ) : null}
        {decision.alternatives !== undefined ? (
          <div className="detail-field detail-field--full">
            <dt>Alternatives considered</dt>
            <dd>{decision.alternatives}</dd>
          </div>
        ) : null}
        {decision.decisionDate !== undefined ? (
          <div className="detail-field">
            <dt>Decision date</dt>
            <dd>{formatDecisionDate(decision.decisionDate)}</dd>
          </div>
        ) : null}
        {decision.effectiveDate !== undefined ? (
          <div className="detail-field">
            <dt>Effective date</dt>
            <dd>{formatDecisionDate(decision.effectiveDate)}</dd>
          </div>
        ) : null}
        {linkedProgram !== undefined ? (
          <div className="detail-field">
            <dt>Program</dt>
            <dd>{linkedProgram.name}</dd>
          </div>
        ) : null}
        {linkedProject !== undefined ? (
          <div className="detail-field">
            <dt>Project</dt>
            <dd>{linkedProject.name}</dd>
          </div>
        ) : null}
        <div className="detail-field">
          <dt>Created</dt>
          <dd>{formatDecisionDate(decision.createdAt)}</dd>
        </div>
        <div className="detail-field">
          <dt>Updated</dt>
          <dd>{formatDecisionDate(decision.updatedAt)}</dd>
        </div>
      </dl>
    </section>
  );
}
