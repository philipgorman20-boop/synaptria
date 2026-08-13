import type { RecommendationReviewSnapshot } from '@synaptria/application';

export interface RecommendationReviewSummaryProps {
  readonly snapshot: RecommendationReviewSnapshot;
}

export function RecommendationReviewSummaryPanel({
  snapshot,
}: RecommendationReviewSummaryProps) {
  const { summary } = snapshot;

  return (
    <section
      className="mission-control-panel recommendation-review-summary"
      aria-labelledby="recommendation-review-summary-heading"
    >
      <div className="mission-control-panel-header">
        <h2 id="recommendation-review-summary-heading">Review summary</h2>
        <p className="mission-control-panel-description">
          Current deterministic recommendations and recorded review decisions.
        </p>
      </div>

      <dl className="recommendation-review-summary-grid">
        <div>
          <dt>Pending</dt>
          <dd>{summary.pending}</dd>
        </div>
        <div>
          <dt>Accepted</dt>
          <dd>{summary.accepted}</dd>
        </div>
        <div>
          <dt>Dismissed</dt>
          <dd>{summary.dismissed}</dd>
        </div>
        <div>
          <dt>Total</dt>
          <dd>{summary.total}</dd>
        </div>
      </dl>
    </section>
  );
}
