import type { Task } from '@synaptria/domain/tasks';

import {
  formatOptionalTaskDate,
  formatTaskDate,
  formatTaskPriority,
  formatTaskStatus,
} from '../../../../../../../../lib/tasks-format';

export const TASK_DETAIL_METADATA_HEADING = 'Task details';
export const TASK_READ_ONLY_NOTICE =
  'Editing tasks is not available yet. This page is read-only.';

export interface TaskDetailMetadataProps {
  readonly task: Task;
}

export function TaskDetailMetadata({ task }: TaskDetailMetadataProps) {
  return (
    <section
      aria-labelledby="task-detail-metadata-heading"
      className="program-detail-metadata"
    >
      <h2 id="task-detail-metadata-heading">{TASK_DETAIL_METADATA_HEADING}</h2>
      <p className="form-help">{TASK_READ_ONLY_NOTICE}</p>

      <dl className="program-detail-metadata-list">
        <div className="program-card-detail">
          <dt>Status</dt>
          <dd>{formatTaskStatus(task.status)}</dd>
        </div>
        <div className="program-card-detail">
          <dt>Priority</dt>
          <dd>{formatTaskPriority(task.priority)}</dd>
        </div>
        <div className="program-card-detail">
          <dt>Planned start</dt>
          <dd>{formatOptionalTaskDate(task.plannedStartDate)}</dd>
        </div>
        <div className="program-card-detail">
          <dt>Planned end</dt>
          <dd>{formatOptionalTaskDate(task.plannedEndDate)}</dd>
        </div>
        <div className="program-card-detail">
          <dt>Actual start</dt>
          <dd>{formatOptionalTaskDate(task.actualStartDate)}</dd>
        </div>
        <div className="program-card-detail">
          <dt>Actual end</dt>
          <dd>{formatOptionalTaskDate(task.actualEndDate)}</dd>
        </div>
        <div className="program-card-detail">
          <dt>Created</dt>
          <dd>{formatTaskDate(task.createdAt)}</dd>
        </div>
        <div className="program-card-detail">
          <dt>Updated</dt>
          <dd>{formatTaskDate(task.updatedAt)}</dd>
        </div>
      </dl>
    </section>
  );
}
