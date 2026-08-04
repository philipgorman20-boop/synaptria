export const TASKS_LIST_LOADING_LABEL = 'Loading tasks';

export function TasksListSkeleton() {
  return (
    <div
      aria-busy="true"
      aria-label={TASKS_LIST_LOADING_LABEL}
      className="programs-table-wrapper"
    >
      <table className="programs-table programs-table-skeleton">
        <thead>
          <tr>
            <th scope="col">Task</th>
            <th scope="col">Status</th>
            <th scope="col">Priority</th>
            <th scope="col">Planned end</th>
            <th scope="col">Actual end</th>
          </tr>
        </thead>
        <tbody>
          {['task-skeleton-1', 'task-skeleton-2', 'task-skeleton-3'].map((rowId) => (
            <tr key={rowId}>
              <td>
                <span className="programs-skeleton-line programs-skeleton-line-wide" />
              </td>
              <td>
                <span className="programs-skeleton-badge" />
              </td>
              <td>
                <span className="programs-skeleton-badge" />
              </td>
              <td>
                <span className="programs-skeleton-line" />
              </td>
              <td>
                <span className="programs-skeleton-line" />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
