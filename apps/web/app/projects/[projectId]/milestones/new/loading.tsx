export const CREATE_MILESTONE_LOADING_LABEL = 'Loading milestone create form';

export default function CreateMilestoneLoading() {
  return (
    <main aria-busy="true" aria-label={CREATE_MILESTONE_LOADING_LABEL} className="dashboard programs-page program-detail-page">
      <header className="program-detail-header">
        <div className="program-detail-heading">
          <p className="eyebrow">MILESTONE</p>
          <h1>Create milestone</h1>
          <p className="programs-skeleton-line programs-skeleton-line-wide" />
        </div>
      </header>

      <section className="program-detail-metadata">
        <h2>Milestone details</h2>
        <div className="organization-form">
          <span className="programs-skeleton-line programs-skeleton-line-wide" />
          <span className="programs-skeleton-line programs-skeleton-line-wide" />
          <span className="programs-skeleton-line programs-skeleton-line-wide" />
        </div>
      </section>
    </main>
  );
}
