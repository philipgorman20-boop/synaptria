'use client';

export const MILESTONE_DETAIL_ERROR_HEADING = 'Milestone unavailable';
export const MILESTONE_DETAIL_ERROR_ROLE = 'alert';

export interface MilestoneDetailErrorProps {
  readonly error: Error & { digest?: string };
  readonly reset: () => void;
}

export default function MilestoneDetailError({
  error,
  reset,
}: MilestoneDetailErrorProps) {
  return (
    <main className="dashboard programs-page program-detail-page">
      <section className="programs-empty-state" role={MILESTONE_DETAIL_ERROR_ROLE}>
        <p className="eyebrow">MILESTONE</p>
        <h1>{MILESTONE_DETAIL_ERROR_HEADING}</h1>
        <p>
          The milestone details could not be loaded.{' '}
          {error.message || 'Please try again.'}
        </p>
        <div className="programs-empty-state-actions">
          <button className="primary-button" type="button" onClick={reset}>
            Try again
          </button>
        </div>
      </section>
    </main>
  );
}
