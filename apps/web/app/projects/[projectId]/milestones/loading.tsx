import { MilestonesListSkeleton } from './components/milestones-list-skeleton';

export default function ProjectMilestonesLoading() {
  return (
    <main className="dashboard programs-page">
      <header className="programs-page-header">
        <div className="programs-page-heading">
          <p className="eyebrow">EXECUTION</p>
          <h1>Milestones</h1>
          <p className="programs-skeleton-line programs-skeleton-line-wide" />
          <p className="programs-page-count">
            <span className="programs-skeleton-line programs-skeleton-line-short" />
          </p>
        </div>
      </header>

      <MilestonesListSkeleton />
    </main>
  );
}
