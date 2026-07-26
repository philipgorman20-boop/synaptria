export const MILESTONES_LIST_LOADING_LABEL = 'Loading milestones';

export function MilestonesListSkeleton() {
  return (
    <div
      aria-busy="true"
      aria-label={MILESTONES_LIST_LOADING_LABEL}
      className="programs-table-wrapper"
    >
      <table className="programs-table programs-table-skeleton">
        <thead>
          <tr>
            <th scope="col">Milestone</th>
            <th scope="col">Status</th>
            <th scope="col">Priority</th>
            <th scope="col">Planned end</th>
            <th scope="col">Actual end</th>
          </tr>
        </thead>
        <tbody>
          {['milestone-skeleton-1', 'milestone-skeleton-2', 'milestone-skeleton-3'].map(
            (rowId) => (
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
            ),
          )}
        </tbody>
      </table>
    </div>
  );
}
