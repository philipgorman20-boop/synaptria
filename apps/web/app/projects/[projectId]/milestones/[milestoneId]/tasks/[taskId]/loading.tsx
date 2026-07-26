export const TASK_DETAIL_LOADING_LABEL = 'Loading task details';

export default function TaskDetailLoading() {
  return (
    <main
      aria-busy="true"
      aria-label={TASK_DETAIL_LOADING_LABEL}
      className="dashboard programs-page program-detail-page"
    >
      <header className="program-detail-header">
        <div className="program-detail-heading">
          <p className="eyebrow">TASK</p>
          <h1>
            <span className="programs-skeleton-line programs-skeleton-line-wide" />
          </h1>
          <p className="programs-skeleton-line programs-skeleton-line-wide" />
        </div>
      </header>

      <section className="program-detail-metadata">
        <h2>Task details</h2>
        <div className="program-detail-metadata-list">
          <span className="programs-skeleton-line programs-skeleton-line-wide" />
          <span className="programs-skeleton-line programs-skeleton-line-wide" />
          <span className="programs-skeleton-line programs-skeleton-line-wide" />
        </div>
      </section>
    </main>
  );
}
