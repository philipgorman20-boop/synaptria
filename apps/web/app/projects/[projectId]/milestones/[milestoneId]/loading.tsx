export const MILESTONE_DETAIL_LOADING_LABEL = 'Loading milestone details';

export default function MilestoneDetailLoading() {
  return (
    <main
      aria-busy="true"
      aria-label={MILESTONE_DETAIL_LOADING_LABEL}
      className="dashboard programs-page program-detail-page"
    >
      <header className="program-detail-header">
        <div className="program-detail-heading">
          <p className="eyebrow">MILESTONE</p>
          <h1>
            <span className="programs-skeleton-line programs-skeleton-line-wide" />
          </h1>
          <p className="programs-skeleton-line programs-skeleton-line-wide" />
        </div>
      </header>

      <section className="program-detail-metadata">
        <h2>Milestone details</h2>
        <div className="program-detail-metadata-list">
          <span className="programs-skeleton-line programs-skeleton-line-wide" />
          <span className="programs-skeleton-line programs-skeleton-line-wide" />
          <span className="programs-skeleton-line programs-skeleton-line-wide" />
        </div>
      </section>
    </main>
  );
}
