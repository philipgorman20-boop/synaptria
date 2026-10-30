import type { OrganizationId, TaskId } from '@synaptria/core';
import type { OrganizationRole } from '@synaptria/core/context';
import type { Task, TaskRepository } from '@synaptria/domain/tasks';
import { PERMISSIONS, requirePermission } from '@synaptria/permissions';

import { ApplicationError } from '../../shared/application-error';

export interface GetTaskContext {
  readonly organizationId: OrganizationId;
  readonly role: OrganizationRole;
}

export interface GetTaskInput {
  readonly taskId: TaskId;
}

export interface GetTaskOutput {
  readonly task: Task;
}

/**
 * Fetches one task within the authenticated organization.
 *
 * Returns not found when the task is missing or belongs to another
 * organization.
 */
export class GetTaskUseCase {
  constructor(private readonly tasks: TaskRepository) {}

  async execute(
    context: GetTaskContext,
    input: GetTaskInput,
  ): Promise<GetTaskOutput> {
    requirePermission(context.role, PERMISSIONS.TASKS_READ);

    const task = await this.tasks.findById(context.organizationId, input.taskId);

    if (task === null) {
      throw new ApplicationError({
        code: 'NOT_FOUND',
        message: 'The requested task was not found.',
        details: { taskId: input.taskId },
      });
    }

    return { task };
  }
}
