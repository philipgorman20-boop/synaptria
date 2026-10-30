import type { TaskRepository } from '@synaptria/domain/tasks';

import type {
  TaskActionProposalState,
  TaskActionProposalStateReader,
} from './types';

function toScalarDate(value: Date | undefined): string | null {
  return value === undefined ? null : value.toISOString();
}

export class RepositoryTaskActionProposalStateReader implements TaskActionProposalStateReader {
  constructor(private readonly tasks: TaskRepository) {}

  async findById(
    organizationId: Parameters<TaskActionProposalStateReader['findById']>[0],
    id: Parameters<TaskActionProposalStateReader['findById']>[1],
  ): Promise<TaskActionProposalState | null> {
    const task = await this.tasks.findById(organizationId, id);
    if (task === null) {
      return null;
    }

    return {
      taskId: task.id,
      organizationId: task.organizationId,
      status: task.status,
      priority: task.priority,
      plannedEndDate: toScalarDate(task.plannedEndDate),
      updatedAt: task.updatedAt.toISOString(),
    };
  }
}
