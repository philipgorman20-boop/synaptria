import type {
  MilestoneId,
  OrganizationId,
  TaskId,
} from '@synaptria/core';

import type { Priority } from '../shared/priority';
import type { Task, TaskStatus } from './models';

export interface CreateTaskInput {
  readonly organizationId: OrganizationId;
  readonly milestoneId: MilestoneId;
  readonly name: string;
  readonly description?: string;
  readonly status?: TaskStatus;
  readonly priority?: Priority;
  readonly plannedStartDate?: Date;
  readonly plannedEndDate?: Date;
  readonly actualStartDate?: Date;
  readonly actualEndDate?: Date;
}

export interface UpdateTaskInput {
  readonly name?: string;
  readonly description?: string | null;
  readonly status?: TaskStatus;
  readonly priority?: Priority;
  readonly plannedStartDate?: Date | null;
  readonly plannedEndDate?: Date | null;
  readonly actualStartDate?: Date | null;
  readonly actualEndDate?: Date | null;
}

export interface TaskRepository {
  create(input: CreateTaskInput): Promise<Task>;
  findById(
    organizationId: OrganizationId,
    id: TaskId,
  ): Promise<Task | null>;
  update(
    organizationId: OrganizationId,
    id: TaskId,
    input: UpdateTaskInput,
  ): Promise<Task>;
  listForOrganization(
    organizationId: OrganizationId,
  ): Promise<readonly Task[]>;
  listForMilestone(
    organizationId: OrganizationId,
    milestoneId: MilestoneId,
  ): Promise<readonly Task[]>;
}
