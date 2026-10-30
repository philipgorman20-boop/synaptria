'use client';

export const CREATE_TASK_ERROR_HEADING = 'Create task unavailable';
export const CREATE_TASK_ERROR_ROLE = 'alert';

export interface CreateTaskErrorProps {
  readonly error: Error & { digest?: string };
  readonly reset: () => void;
}

export default function CreateTaskError({ error, reset }: CreateTaskErrorProps) {
  return (
    <main className="dashboard programs-page program-detail-page">
      <section className="programs-empty-state" role={CREATE_TASK_ERROR_ROLE}>
        <p className="eyebrow">TASK</p>
        <h1>{CREATE_TASK_ERROR_HEADING}</h1>
        <p>
          The task create form could not be loaded.{' '}
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
