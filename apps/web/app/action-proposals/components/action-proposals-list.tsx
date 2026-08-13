import type { ActionProposalListItem } from '@synaptria/application';
import Link from 'next/link';

import {
  formatActionProposalActionType,
  formatActionProposalEntityLabel,
  formatActionProposalKind,
  formatActionProposalStatus,
  getActionProposalEvidenceHref,
  getActionProposalRecommendationHref,
  getActionProposalTargetHref,
} from '../../../lib/action-proposals-format';

export interface ActionProposalsListProps {
  readonly items: readonly ActionProposalListItem[];
}

export function ActionProposalsList({ items }: ActionProposalsListProps) {
  return (
    <section
      className="mission-control-panel action-proposals-list"
      aria-labelledby="action-proposals-list-heading"
    >
      <div className="mission-control-panel-header">
        <h2 id="action-proposals-list-heading">Proposed actions</h2>
        <p className="mission-control-panel-description">
          These proposals describe possible operational changes. Nothing on this page executes
          mutations.
        </p>
      </div>

      {items.length === 0 ? (
        <section
          className="mission-control-empty-organization action-proposals-empty"
          aria-labelledby="action-proposals-empty-heading"
        >
          <p className="eyebrow">NO PROPOSALS</p>
          <h3 id="action-proposals-empty-heading">No action proposals available</h3>
          <p>
            Action proposals are derived only from recommendations with an accepted review
            decision in the current deterministic snapshot.
          </p>
        </section>
      ) : (
        <ul className="action-proposals-items">
          {items.map((item) => (
            <ActionProposalItem key={item.proposal.id} item={item} />
          ))}
        </ul>
      )}
    </section>
  );
}

function ActionProposalItem({ item }: { readonly item: ActionProposalListItem }) {
  const { proposal, source } = item;
  const targetHref = getActionProposalTargetHref(item);

  return (
    <li
      className="action-proposal-item"
      id={encodeURIComponent(proposal.recommendationId)}
    >
      <div className="action-proposal-item-header">
        <span className="mission-control-type-label">
          {formatActionProposalActionType(proposal.actionType)}
        </span>
        <span className="action-proposal-status-badge">{formatActionProposalStatus(proposal.status)}</span>
        <span className="action-proposal-kind-badge">{formatActionProposalKind(proposal.proposalKind)}</span>
      </div>

      <h3 className="action-proposal-title">{proposal.title}</h3>
      <p className="action-proposal-description">{proposal.description}</p>

      <dl className="action-proposal-details">
        <div>
          <dt>Source recommendation</dt>
          <dd>
            <Link
              className="mission-control-inline-link"
              href={getActionProposalRecommendationHref(proposal.recommendationId)}
            >
              View recommendation
            </Link>
          </dd>
        </div>
        <div>
          <dt>Target</dt>
          <dd>
            {targetHref === null ? (
              formatActionProposalEntityLabel({ entityType: proposal.target.entityType })
            ) : (
              <Link className="mission-control-inline-link" href={targetHref}>
                {formatActionProposalEntityLabel({ entityType: proposal.target.entityType })}
              </Link>
            )}
          </dd>
        </div>
        <div>
          <dt>Proposed changes</dt>
          <dd>
            {proposal.proposedChanges.length === 0 ? (
              <p className="action-proposal-advisory-note">
                Advisory review proposal with no operational field mutations represented.
              </p>
            ) : (
              <ul className="action-proposal-changes">
                {proposal.proposedChanges.map((change) => (
                  <li key={change.field}>
                    <strong>{change.field}</strong>: {String(change.currentValue)} →{' '}
                    {String(change.proposedValue)}
                  </li>
                ))}
              </ul>
            )}
          </dd>
        </div>
        <div>
          <dt>Evidence</dt>
          <dd>
            <ul className="action-proposal-evidence-list">
              {source.evidence.flatMap((evidence) => {
                if (evidence.evidenceType !== 'operationalEntity') {
                  return [];
                }

                const href = getActionProposalEvidenceHref(source.evidence, evidence.reference);
                const label = formatActionProposalEntityLabel(evidence.reference);
                const key = `${evidence.reference.entityType}:${evidence.reference.entityId}`;

                return [
                  <li key={key}>
                    {href === null ? (
                      label
                    ) : (
                      <Link className="mission-control-inline-link" href={href}>
                        {label}
                      </Link>
                    )}
                  </li>,
                ];
              })}
            </ul>
          </dd>
        </div>
      </dl>
    </li>
  );
}
