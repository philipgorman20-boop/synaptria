import {
  Prisma,
  type Task as PrismaTask,
  type PrismaClient,
} from '@prisma/client';
import {
  identifier,
  milestoneId,
  type MilestoneId,
  type OrganizationId,
  type TaskId,
} from '@synaptria/core';
import { NotFoundError } from '@synaptria/core/errors';
import type { Priority } from '@synaptria/domain/shared';
import type {
  CreateTaskInput,
  Task,
  TaskRepository,
  TaskStatus,
  UpdateTaskInput,
} from '@synaptria/domain/tasks';

export type TaskDatabaseClient = Pick<PrismaClient, 'task'>;

const TASK_SELECT = {
  id: true,
  organizationId: true,
  milestoneId: true,
  name: true,
  description: true,
  status: true,
  priority: true,
  plannedStartDate: true,
  plannedEndDate: true,
  actualStartDate: true,
  actualEndDate: true,
  createdAt: true,
  updatedAt: true,
} as const satisfies Prisma.TaskSelect;

type SelectedTask = Prisma.TaskGetPayload<{
  select: typeof TASK_SELECT;
}>;

const activeTaskWhere = (
  organizationId: OrganizationId,
): Prisma.TaskWhereInput => ({
  organizationId,
  deletedAt: null,
});

export class PrismaTaskRepository implements TaskRepository {
  constructor(private readonly client: TaskDatabaseClient) {}

  async create(input: CreateTaskInput): Promise<Task> {
    const data: Prisma.TaskUncheckedCreateInput = {
      organizationId: input.organizationId,
      milestoneId: input.milestoneId,
      name: input.name,
      ...(input.description === undefined
        ? {}
        : { description: input.description }),
      ...(input.status === undefined ? {} : { status: input.status }),
      ...(input.priority === undefined ? {} : { priority: input.priority }),
      ...(input.plannedStartDate === undefined
        ? {}
        : { plannedStartDate: input.plannedStartDate }),
      ...(input.plannedEndDate === undefined
        ? {}
        : { plannedEndDate: input.plannedEndDate }),
      ...(input.actualStartDate === undefined
        ? {}
        : { actualStartDate: input.actualStartDate }),
      ...(input.actualEndDate === undefined
        ? {}
        : { actualEndDate: input.actualEndDate }),
    };

    const row = await this.client.task.create({
      data,
      select: TASK_SELECT,
    });
    return mapTask(row);
  }

  async findById(
    organizationId: OrganizationId,
    id: TaskId,
  ): Promise<Task | null> {
    const row = await this.client.task.findFirst({
      where: {
        ...activeTaskWhere(organizationId),
        id,
      },
      select: TASK_SELECT,
    });
    return row === null ? null : mapTask(row);
  }

  async update(
    organizationId: OrganizationId,
    id: TaskId,
    input: UpdateTaskInput,
  ): Promise<Task> {
    const existing = await this.findById(organizationId, id);
    if (existing === null) {
      throw new NotFoundError('Task', { taskId: id, organizationId });
    }

    const data: Prisma.TaskUpdateInput = {
      ...(input.name === undefined ? {} : { name: input.name }),
      ...(input.description === undefined
        ? {}
        : { description: input.description }),
      ...(input.status === undefined ? {} : { status: input.status }),
      ...(input.priority === undefined ? {} : { priority: input.priority }),
      ...(input.plannedStartDate === undefined
        ? {}
        : { plannedStartDate: input.plannedStartDate }),
      ...(input.plannedEndDate === undefined
        ? {}
        : { plannedEndDate: input.plannedEndDate }),
      ...(input.actualStartDate === undefined
        ? {}
        : { actualStartDate: input.actualStartDate }),
      ...(input.actualEndDate === undefined
        ? {}
        : { actualEndDate: input.actualEndDate }),
    };

    const result = await this.client.task.updateMany({
      where: {
        id,
        ...activeTaskWhere(organizationId),
      },
      data,
    });

    if (result.count === 0) {
      throw new NotFoundError('Task', { taskId: id, organizationId });
    }

    const row = await this.client.task.findFirst({
      where: {
        ...activeTaskWhere(organizationId),
        id,
      },
      select: TASK_SELECT,
    });

    if (row === null) {
      throw new NotFoundError('Task', { taskId: id, organizationId });
    }

    return mapTask(row);
  }

  async listForOrganization(
    organizationId: OrganizationId,
  ): Promise<readonly Task[]> {
    const rows = await this.client.task.findMany({
      where: activeTaskWhere(organizationId),
      select: TASK_SELECT,
    });
    return rows.map(mapTask);
  }

  async listForMilestone(
    organizationId: OrganizationId,
    milestoneIdValue: MilestoneId,
  ): Promise<readonly Task[]> {
    const rows = await this.client.task.findMany({
      where: {
        ...activeTaskWhere(organizationId),
        milestoneId: milestoneIdValue,
      },
      select: TASK_SELECT,
    });
    return rows.map(mapTask);
  }
}

export function mapTask(row: SelectedTask | PrismaTask): Task {
  return {
    id: identifier(row.id, 'TaskId') as TaskId,
    organizationId: identifier(row.organizationId, 'OrganizationId') as OrganizationId,
    milestoneId: milestoneId(row.milestoneId),
    name: row.name,
    ...(row.description === null ? {} : { description: row.description }),
    status: row.status as TaskStatus,
    priority: row.priority as Priority,
    ...(row.plannedStartDate === null
      ? {}
      : { plannedStartDate: row.plannedStartDate }),
    ...(row.plannedEndDate === null ? {} : { plannedEndDate: row.plannedEndDate }),
    ...(row.actualStartDate === null
      ? {}
      : { actualStartDate: row.actualStartDate }),
    ...(row.actualEndDate === null ? {} : { actualEndDate: row.actualEndDate }),
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
}
