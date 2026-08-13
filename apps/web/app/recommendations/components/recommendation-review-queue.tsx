import type { RecommendationReviewItem } from '@synaptria/application';
import Link from 'next/link';

import { acceptRecommendationAction } from '../../actions/recommendations/accept-recommendation';
import { dismissRecommendationAction } from '../../actions/recommendations/dismiss-recommendation';
import {
  formatEntityReferenceLabel,
  formatRecommendationConfidence,
  formatRecommendationPriority,
  formatRecommendationReviewStatus,
  formatRecommendationType,
  getRecommendationEntityHref,
  getRecommendationEvidenceHref,
} from '../../../lib/recommendations-format';

export interface RecommendationReviewQueueProps {
  readonly items: readonly RecommendationReviewItem[];
  readonly canReview: boolean;
}

export function RecommendationReviewQueue({
  items,
  canReview,
}: RecommendationReviewQueueProps) {
  return (
    <section
      className="mission-control-panel recommendation-review-queue"
      aria-labelledby="recommendation-review-queue-heading"
    >
      <div className="mission-control-panel-header">
        <h2 id="recommendation-review-queue-heading">Recommendation queue</h2>
        <p className="mission-control-panel-description">
          Inspect evidence-backed recommendations and record an explicit review decision.
        </p>
      </div>

      {items.length === 0 ? (
        <p className="mission-control-empty-state">
          No recommendations are available in the current deterministic snapshot.
        </p>
      ) : (
        <ul className="recommendation-review-list">
          {items.map((item) => (
            <RecommendationReviewQueueItem
              canReview={canReview}
              item={item}
              key={item.recommendation.id}
            />
          ))}
        </ul>
      )}
    </section>
  );
}

function RecommendationReviewQueueItem({
  item,
  canReview,
}: {
  readonly item: RecommendationReviewItem;
  readonly canReview: boolean;
}) {
  const { recommendation, review } = item;
  const targetHref = getRecommendationEntityHref(recommendation.targetEntity);
  const targetLabel = formatEntityReferenceLabel(recommendation.targetEntity);
  const reviewStatusLabel = formatRecommendationReviewStatus(review.status);
  const showActions = canReview && review.status === 'pending';

  return (
    <li className="recommendation-review-item" data-review-status={review.status}>
      <div className="recommendation-review-item-header">
        <div className="recommendation-review-labels">
          <span
            className="mission-control-severity-badge"
            data-severity={recommendation.priority}
          >
            {formatRecommendationPriority(recommendation.priority)}
          </span>
          <span className="mission-control-type-label">
            {formatRecommendationType(recommendation.type)}
          </span>
          <span className="recommendation-review-status-badge" data-review-status={review.status}>
            {reviewStatusLabel}
          </span>
        </div>
        <span className="recommendation-review-confidence">
          Confidence: {formatRecommendationConfidence(recommendation.confidence)}
        </span>
      </div>

      <h3 className="recommendation-review-title">{recommendation.title}</h3>

      <dl className="recommendation-review-details">
        <div>
          <dt>Proposed action</dt>
          <dd>{recommendation.proposedAction.description}</dd>
        </div>
        <div>
          <dt>Rationale</dt>
          <dd>{recommendation.rationale}</dd>
        </div>
        <div>
          <dt>Target</dt>
          <dd>
            {targetHref === null ? (
              targetLabel
            ) : (
              <Link className="mission-control-inline-link" href={targetHref}>
                {targetLabel}
              </Link>
            )}
          </dd>
        </div>
        <div>
          <dt>Evidence</dt>
          <dd>
            <ul className="recommendation-review-evidence-list">
              {recommendation.evidence.flatMap((evidence) => {
                if (evidence.evidenceType !== 'operationalEntity') {
                  return [];
                }

                const href = getRecommendationEvidenceHref(item, evidence.reference);
                const label = formatEntityReferenceLabel(evidence.reference);
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
        {review.reviewedAt !== undefined ? (
          <div>
            <dt>Reviewed</dt>
            <dd>
              {review.reviewedAt.toISOString()}
              {review.dismissalReason !== undefined
                ? ` — ${review.dismissalReason}`
                : ''}
            </dd>
          </div>
        ) : null}
      </dl>

      {showActions ? (
        <div className="recommendation-review-actions">
          <form action={acceptRecommendationAction}>
            <input name="recommendationId" type="hidden" value={recommendation.id} />
            <button
              aria-label={`Accept recommendation ${recommendation.title}`}
              className="primary-button recommendation-review-action-button"
              type="submit"
            >
              Accept
            </button>
          </form>

          <form action={dismissRecommendationAction}>
            <input name="recommendationId" type="hidden" value={recommendation.id} />
            <button
              aria-label={`Dismiss recommendation ${recommendation.title}`}
              className="secondary-button recommendation-review-action-button"
              type="submit"
            >
              Dismiss
            </button>
          </form>
        </div>
      ) : null}
    </li>
  );
}
