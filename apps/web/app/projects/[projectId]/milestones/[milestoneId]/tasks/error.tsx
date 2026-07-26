'use client';

export const TASKS_ERROR_HEADING = 'Tasks unavailable';
export const TASKS_ERROR_ROLE = 'alert';

export interface MilestoneTasksErrorProps {
  readonly error: Error & { digest?: string };
  readonly reset: () => void;
}

export default function MilestoneTasksError({
  error,
  reset,
}: MilestoneTasksErrorProps) {
  return (
    <main className="dashboard programs-page">
      <section className="programs-empty-state" role={TASKS_ERROR_ROLE}>
        <p className="eyebrow">EXECUTION</p>
        <h1>{TASKS_ERROR_HEADING}</h1>
        <p>
          The task list could not be loaded. {error.message || 'Please try again.'}
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
