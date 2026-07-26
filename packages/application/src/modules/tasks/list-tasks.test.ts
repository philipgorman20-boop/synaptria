import assert from 'node:assert/strict';
import test from 'node:test';

import {
  milestoneId,
  organizationId,
  taskId,
  type MilestoneId,
  type OrganizationId,
  type TaskId,
} from '@synaptria/core';
import type {
  CreateTaskInput,
  Task,
  TaskRepository,
  UpdateTaskInput,
} from '@synaptria/domain/tasks';

import { ListTasksUseCase } from './list-tasks';

const ORGANIZATION_ID = organizationId('org-1');
const OTHER_ORGANIZATION_ID = organizationId('org-2');
const NOW = new Date('2026-07-26T16:00:00.000Z');

class InMemoryTaskRepository implements TaskRepository {
  constructor(readonly tasks: readonly Task[]) {}

  async listForOrganization(
    organizationId: OrganizationId,
  ): Promise<readonly Task[]> {
    return this.tasks.filter((task) => task.organizationId === organizationId);
  }

  async create(_input: CreateTaskInput): Promise<Task> {
    throw new Error('Not implemented in this test.');
  }

  async findById(): Promise<Task | null> {
    return null;
  }

  async update(
    _organizationId: OrganizationId,
    _id: TaskId,
    _input: UpdateTaskInput,
  ): Promise<Task> {
    throw new Error('Not implemented in this test.');
  }

  async listForMilestone(): Promise<readonly Task[]> {
    return [];
  }
}

test('lists tasks for the active organization alphabetically', async () => {
  const repository = new InMemoryTaskRepository([
    task(ORGANIZATION_ID, 'task-b', 'Beta Task'),
    task(ORGANIZATION_ID, 'task-a', 'Alpha Task'),
    task(OTHER_ORGANIZATION_ID, 'task-other', 'Other Org Task'),
  ]);
  const useCase = new ListTasksUseCase(repository);

  const output = await useCase.execute({
    organizationId: ORGANIZATION_ID,
    role: 'MEMBER',
  });

  assert.deepEqual(
    output.tasks.map((item) => item.id),
    [taskId('task-a'), taskId('task-b')],
  );
});

test('returns an empty result when the organization has no tasks', async () => {
  const useCase = new ListTasksUseCase(new InMemoryTaskRepository([]));

  const output = await useCase.execute({
    organizationId: ORGANIZATION_ID,
    role: 'VIEWER',
  });

  assert.deepEqual(output, { tasks: [] });
});

test('does not return tasks from another organization', async () => {
  const useCase = new ListTasksUseCase(
    new InMemoryTaskRepository([
      task(OTHER_ORGANIZATION_ID, 'task-other', 'Other Org Task'),
    ]),
  );

  const output = await useCase.execute({
    organizationId: ORGANIZATION_ID,
    role: 'MEMBER',
  });

  assert.deepEqual(output, { tasks: [] });
});

test('allows viewers to list tasks when they have tasks.read permission', async () => {
  const useCase = new ListTasksUseCase(
    new InMemoryTaskRepository([task(ORGANIZATION_ID, 'task-a', 'Alpha Task')]),
  );

  const output = await useCase.execute({
    organizationId: ORGANIZATION_ID,
    role: 'VIEWER',
  });

  assert.equal(output.tasks.length, 1);
});

function task(
  organization: OrganizationId,
  id: string,
  name: string,
  milestone: MilestoneId = milestoneId('milestone-1'),
): Task {
  return {
    id: taskId(id),
    organizationId: organization,
    milestoneId: milestone,
    name,
    status: 'TODO',
    priority: 'MEDIUM',
    createdAt: NOW,
    updatedAt: NOW,
  };
}
