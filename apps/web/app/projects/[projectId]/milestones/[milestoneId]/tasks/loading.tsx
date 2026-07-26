import { TasksListSkeleton } from './components/tasks-list-skeleton';

export default function MilestoneTasksLoading() {
  return (
    <main className="dashboard programs-page">
      <header className="programs-page-header">
        <div className="programs-page-heading">
          <p className="eyebrow">EXECUTION</p>
          <h1>Tasks</h1>
          <p className="programs-skeleton-line programs-skeleton-line-wide" />
          <p className="programs-page-count">
            <span className="programs-skeleton-line programs-skeleton-line-short" />
          </p>
        </div>
      </header>

      <TasksListSkeleton />
    </main>
  );
}
