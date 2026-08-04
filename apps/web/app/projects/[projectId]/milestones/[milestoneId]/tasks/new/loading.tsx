export const CREATE_TASK_LOADING_LABEL = 'Loading task create form';

export default function CreateTaskLoading() {
  return (
    <main
      aria-busy="true"
      aria-label={CREATE_TASK_LOADING_LABEL}
      className="dashboard programs-page program-detail-page"
    >
      <header className="program-detail-header">
        <div className="program-detail-heading">
          <p className="eyebrow">TASK</p>
          <h1>Create task</h1>
          <p className="programs-skeleton-line programs-skeleton-line-wide" />
        </div>
      </header>

      <section className="program-detail-metadata">
        <h2>Task details</h2>
        <div className="organization-form">
          <span className="programs-skeleton-line programs-skeleton-line-wide" />
          <span className="programs-skeleton-line programs-skeleton-line-wide" />
          <span className="programs-skeleton-line programs-skeleton-line-wide" />
        </div>
      </section>
    </main>
  );
}
