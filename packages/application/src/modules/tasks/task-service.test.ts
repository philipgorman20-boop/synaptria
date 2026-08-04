import assert from 'node:assert/strict';
import test from 'node:test';

import {
  correlationId,
  membershipId,
  milestoneId,
  organizationId,
  requestId,
  taskId,
  userId,
} from '@synaptria/core';

import type {
  CreateTaskContext,
  CreateTaskInput,
  CreateTaskOutput,
} from './create-task';
import type { GetTaskContext, GetTaskInput, GetTaskOutput } from './get-task';
import type {
  ListMilestoneTasksContext,
  ListMilestoneTasksInput,
  ListMilestoneTasksOutput,
} from './list-milestone-tasks';
import type { ListTasksContext, ListTasksOutput } from './list-tasks';
import { TaskService } from './task-service';

const USER_ID = userId('user-1');
const ORGANIZATION_ID = organizationId('org-1');
const MILESTONE_ID = milestoneId('milestone-1');
const TASK_ID = taskId('task-1');
const NOW = new Date('2026-07-26T18:00:00.000Z');

class CreateTaskStub {
  received?: Readonly<{
    context: CreateTaskContext;
    input: CreateTaskInput;
  }>;

  constructor(private readonly output: CreateTaskOutput) {}

  async execute(
    context: CreateTaskContext,
    input: CreateTaskInput,
  ): Promise<CreateTaskOutput> {
    this.received = { context, input };
    return this.output;
  }
}

class ListTasksStub {
  received?: ListTasksContext;

  constructor(private readonly output: ListTasksOutput) {}

  async execute(context: ListTasksContext): Promise<ListTasksOutput> {
    this.received = context;
    return this.output;
  }
}

class ListMilestoneTasksStub {
  received?: Readonly<{
    context: ListMilestoneTasksContext;
    input: ListMilestoneTasksInput;
  }>;

  constructor(private readonly output: ListMilestoneTasksOutput) {}

  async execute(
    context: ListMilestoneTasksContext,
    input: ListMilestoneTasksInput,
  ): Promise<ListMilestoneTasksOutput> {
    this.received = { context, input };
    return this.output;
  }
}

class GetTaskStub {
  received?: Readonly<{
    context: GetTaskContext;
    input: GetTaskInput;
  }>;

  constructor(private readonly output: GetTaskOutput) {}

  async execute(
    context: GetTaskContext,
    input: GetTaskInput,
  ): Promise<GetTaskOutput> {
    this.received = { context, input };
    return this.output;
  }
}

test('task service delegates to create, list, listMilestoneTasks, and get use cases', async () => {
  const createOutput: CreateTaskOutput = {
    task: {
      id: TASK_ID,
      organizationId: ORGANIZATION_ID,
      milestoneId: MILESTONE_ID,
      name: 'Prepare assay protocol',
      status: 'TODO',
      priority: 'MEDIUM',
      createdAt: NOW,
      updatedAt: NOW,
    },
  };
  const listOutput: ListTasksOutput = { tasks: [createOutput.task] };
  const listMilestoneOutput: ListMilestoneTasksOutput = {
    tasks: [createOutput.task],
  };
  const getOutput: GetTaskOutput = createOutput;

  const create = new CreateTaskStub(createOutput);
  const list = new ListTasksStub(listOutput);
  const listMilestone = new ListMilestoneTasksStub(listMilestoneOutput);
  const get = new GetTaskStub(getOutput);
  const service = new TaskService(
    create as unknown as import('./create-task').CreateTaskUseCase,
    list as unknown as import('./list-tasks').ListTasksUseCase,
    listMilestone as unknown as import('./list-milestone-tasks').ListMilestoneTasksUseCase,
    get as unknown as import('./get-task').GetTaskUseCase,
  );

  const createContext = {
    organizationId: ORGANIZATION_ID,
    userId: USER_ID,
    membershipId: membershipId('membership-1'),
    role: 'MEMBER' as const,
    requestId: requestId('request-1'),
    correlationId: correlationId('correlation-1'),
  };
  const createInput = {
    milestoneId: MILESTONE_ID,
    name: 'Prepare assay protocol',
  };
  const listContext = {
    organizationId: ORGANIZATION_ID,
    role: 'MEMBER' as const,
  };
  const listMilestoneContext = {
    organizationId: ORGANIZATION_ID,
    role: 'VIEWER' as const,
  };
  const listMilestoneInput = { milestoneId: MILESTONE_ID };
  const getContext = {
    organizationId: ORGANIZATION_ID,
    role: 'VIEWER' as const,
  };
  const getInput = { taskId: TASK_ID };

  assert.equal(await service.createTask(createContext, createInput), createOutput);
  assert.equal(await service.listTasks(listContext), listOutput);
  assert.equal(
    await service.listMilestoneTasks(listMilestoneContext, listMilestoneInput),
    listMilestoneOutput,
  );
  assert.equal(await service.getTask(getContext, getInput), getOutput);
  assert.deepEqual(create.received, { context: createContext, input: createInput });
  assert.deepEqual(list.received, listContext);
  assert.deepEqual(listMilestone.received, {
    context: listMilestoneContext,
    input: listMilestoneInput,
  });
  assert.deepEqual(get.received, { context: getContext, input: getInput });
});
