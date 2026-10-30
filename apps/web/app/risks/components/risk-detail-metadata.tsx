import type { Risk } from '@synaptria/domain/risks';
import type { Program } from '@synaptria/domain/programs';
import type { Project } from '@synaptria/domain/projects';

import {
  formatRiskCategory,
  formatRiskDate,
  formatRiskImpact,
  formatRiskProbability,
  formatRiskStatus,
} from '../risks-format';

export interface RiskDetailMetadataProps {
  readonly risk: Risk;
  readonly programs: readonly Program[];
  readonly projects: readonly Project[];
}

export function RiskDetailMetadata({ risk, programs, projects }: RiskDetailMetadataProps) {
  const linkedProgram = risk.programId !== undefined ? programs.find((p) => p.id === risk.programId) : undefined;
  const linkedProject = risk.projectId !== undefined ? projects.find((p) => p.id === risk.projectId) : undefined;
  return (
    <section aria-labelledby="risk-detail-metadata-heading" className="detail-metadata">
      <h2 id="risk-detail-metadata-heading">Risk details</h2>

      <dl className="detail-metadata-list">
        <div className="detail-field">
          <dt>Status</dt>
          <dd>{formatRiskStatus(risk.status)}</dd>
        </div>
        <div className="detail-field">
          <dt>Category</dt>
          <dd>{formatRiskCategory(risk.category)}</dd>
        </div>
        <div className="detail-field">
          <dt>Probability</dt>
          <dd>{formatRiskProbability(risk.probability)}</dd>
        </div>
        <div className="detail-field">
          <dt>Impact</dt>
          <dd>{formatRiskImpact(risk.impact)}</dd>
        </div>
        {risk.mitigationPlan !== undefined ? (
          <div className="detail-field detail-field--full">
            <dt>Mitigation plan</dt>
            <dd>{risk.mitigationPlan}</dd>
          </div>
        ) : null}
        {risk.contingencyPlan !== undefined ? (
          <div className="detail-field detail-field--full">
            <dt>Contingency plan</dt>
            <dd>{risk.contingencyPlan}</dd>
          </div>
        ) : null}
        {risk.reviewDate !== undefined ? (
          <div className="detail-field">
            <dt>Review date</dt>
            <dd>{formatRiskDate(risk.reviewDate)}</dd>
          </div>
        ) : null}
        {risk.closedAt !== undefined ? (
          <div className="detail-field">
            <dt>Closed</dt>
            <dd>{formatRiskDate(risk.closedAt)}</dd>
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
          <dd>{formatRiskDate(risk.createdAt)}</dd>
        </div>
        <div className="detail-field">
          <dt>Updated</dt>
          <dd>{formatRiskDate(risk.updatedAt)}</dd>
        </div>
      </dl>
    </section>
  );
}
