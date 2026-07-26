'use client';

export const MILESTONES_ERROR_HEADING = 'Milestones unavailable';
export const MILESTONES_ERROR_ROLE = 'alert';

export interface ProjectMilestonesErrorProps {
  readonly error: Error & { digest?: string };
  readonly reset: () => void;
}

export default function ProjectMilestonesError({
  error,
  reset,
}: ProjectMilestonesErrorProps) {
  return (
    <main className="dashboard programs-page">
      <section className="programs-empty-state" role={MILESTONES_ERROR_ROLE}>
        <p className="eyebrow">EXECUTION</p>
        <h1>{MILESTONES_ERROR_HEADING}</h1>
        <p>
          The milestone list could not be loaded. {error.message || 'Please try again.'}
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
