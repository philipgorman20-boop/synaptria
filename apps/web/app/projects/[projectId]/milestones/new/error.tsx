'use client';

export const CREATE_MILESTONE_ERROR_HEADING = 'Create milestone unavailable';
export const CREATE_MILESTONE_ERROR_ROLE = 'alert';

export interface CreateMilestoneErrorProps {
  readonly error: Error & { digest?: string };
  readonly reset: () => void;
}

export default function CreateMilestoneError({
  error,
  reset,
}: CreateMilestoneErrorProps) {
  return (
    <main className="dashboard programs-page program-detail-page">
      <section className="programs-empty-state" role={CREATE_MILESTONE_ERROR_ROLE}>
        <p className="eyebrow">MILESTONE</p>
        <h1>{CREATE_MILESTONE_ERROR_HEADING}</h1>
        <p>
          The milestone create form could not be loaded.{' '}
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
