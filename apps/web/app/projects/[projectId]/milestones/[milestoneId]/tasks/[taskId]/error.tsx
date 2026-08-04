'use client';

export const TASK_DETAIL_ERROR_HEADING = 'Task unavailable';
export const TASK_DETAIL_ERROR_ROLE = 'alert';

export interface TaskDetailErrorProps {
  readonly error: Error & { digest?: string };
  readonly reset: () => void;
}

export default function TaskDetailError({ error, reset }: TaskDetailErrorProps) {
  return (
    <main className="dashboard programs-page program-detail-page">
      <section className="programs-empty-state" role={TASK_DETAIL_ERROR_ROLE}>
        <p className="eyebrow">TASK</p>
        <h1>{TASK_DETAIL_ERROR_HEADING}</h1>
        <p>
          The task details could not be loaded. {error.message || 'Please try again.'}
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
