import type { MilestoneId, OrganizationId } from '@synaptria/core';
import type { OrganizationRole } from '@synaptria/core/context';
import type { MilestoneRepository } from '@synaptria/domain/milestones';
import type { Task, TaskRepository } from '@synaptria/domain/tasks';
import { PERMISSIONS, requirePermission } from '@synaptria/permissions';

import { ApplicationError } from '../../shared/application-error';

export interface ListMilestoneTasksContext {
  readonly organizationId: OrganizationId;
  readonly role: OrganizationRole;
}

export interface ListMilestoneTasksInput {
  readonly milestoneId: MilestoneId;
}

export interface ListMilestoneTasksOutput {
  readonly tasks: readonly Task[];
}

/**
 * Lists tasks for one milestone within the authenticated organization.
 *
 * Verifies the parent milestone exists and is accessible before listing child
 * tasks. Returns not found when the milestone is missing or belongs to another
 * organization.
 */
export class ListMilestoneTasksUseCase {
  constructor(
    private readonly tasks: TaskRepository,
    private readonly milestones: MilestoneRepository,
  ) {}

  async execute(
    context: ListMilestoneTasksContext,
    input: ListMilestoneTasksInput,
  ): Promise<ListMilestoneTasksOutput> {
    requirePermission(context.role, PERMISSIONS.TASKS_READ);

    const milestone = await this.milestones.findById(
      context.organizationId,
      input.milestoneId,
    );

    if (milestone === null) {
      throw new ApplicationError({
        code: 'NOT_FOUND',
        message: 'The requested milestone was not found.',
        details: { milestoneId: input.milestoneId },
      });
    }

    const tasks = await this.tasks.listForMilestone(
      context.organizationId,
      input.milestoneId,
    );

    return {
      tasks: [...tasks].sort(compareTasks),
    };
  }
}

function compareTasks(left: Task, right: Task): number {
  return left.name.localeCompare(right.name, 'en', { sensitivity: 'base' });
}
