import type { OrganizationId } from '@synaptria/core';
import type { OrganizationRole } from '@synaptria/core/context';
import type { Task, TaskRepository } from '@synaptria/domain/tasks';
import { PERMISSIONS, requirePermission } from '@synaptria/permissions';

export interface ListTasksContext {
  readonly organizationId: OrganizationId;
  readonly role: OrganizationRole;
}

export interface ListTasksOutput {
  readonly tasks: readonly Task[];
}

/**
 * Lists all tasks for the authenticated organization.
 *
 * The persistence adapter scopes this query by organizationId.
 */
export class ListTasksUseCase {
  constructor(private readonly tasks: TaskRepository) {}

  async execute(context: ListTasksContext): Promise<ListTasksOutput> {
    requirePermission(context.role, PERMISSIONS.TASKS_READ);

    const tasks = await this.tasks.listForOrganization(context.organizationId);

    return {
      tasks: [...tasks].sort(compareTasks),
    };
  }
}

function compareTasks(left: Task, right: Task): number {
  return left.name.localeCompare(right.name, 'en', { sensitivity: 'base' });
}
