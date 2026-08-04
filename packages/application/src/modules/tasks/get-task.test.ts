import assert from 'node:assert/strict';
import test from 'node:test';

import {
  milestoneId,
  organizationId,
  taskId,
  type OrganizationId,
  type TaskId,
} from '@synaptria/core';
import type {
  CreateTaskInput,
  Task,
  TaskRepository,
  UpdateTaskInput,
} from '@synaptria/domain/tasks';

import { ApplicationError } from '../../shared/application-error';
import { GetTaskUseCase } from './get-task';

const ORGANIZATION_ID = organizationId('org-1');
const OTHER_ORGANIZATION_ID = organizationId('org-2');
const TASK_ID = taskId('task-1');
const NOW = new Date('2026-07-26T16:00:00.000Z');

class InMemoryTaskRepository implements TaskRepository {
  constructor(readonly task: Task | null) {}

  async findById(
    organizationId: OrganizationId,
    id: TaskId,
  ): Promise<Task | null> {
    if (this.task === null) {
      return null;
    }

    if (this.task.organizationId !== organizationId || this.task.id !== id) {
      return null;
    }

    return this.task;
  }

  async create(_input: CreateTaskInput): Promise<Task> {
    throw new Error('Not implemented in this test.');
  }

  async update(
    _organizationId: OrganizationId,
    _id: TaskId,
    _input: UpdateTaskInput,
  ): Promise<Task> {
    throw new Error('Not implemented in this test.');
  }

  async listForOrganization(): Promise<readonly Task[]> {
    return [];
  }

  async listForMilestone(): Promise<readonly Task[]> {
    return [];
  }
}

test('returns a task within the active organization', async () => {
  const task = taskFixture(ORGANIZATION_ID, TASK_ID, 'Prepare assay protocol');
  const useCase = new GetTaskUseCase(new InMemoryTaskRepository(task));

  const output = await useCase.execute(
    { organizationId: ORGANIZATION_ID, role: 'VIEWER' },
    { taskId: TASK_ID },
  );

  assert.equal(output.task.id, TASK_ID);
});

test('returns not found when the task does not exist', async () => {
  const useCase = new GetTaskUseCase(new InMemoryTaskRepository(null));

  await assert.rejects(
    useCase.execute(
      { organizationId: ORGANIZATION_ID, role: 'MEMBER' },
      { taskId: TASK_ID },
    ),
    (error: unknown) =>
      error instanceof ApplicationError && error.code === 'NOT_FOUND',
  );
});

test('returns not found when the task belongs to another organization', async () => {
  const task = taskFixture(
    OTHER_ORGANIZATION_ID,
    TASK_ID,
    'Other Org Task',
  );
  const useCase = new GetTaskUseCase(new InMemoryTaskRepository(task));

  await assert.rejects(
    useCase.execute(
      { organizationId: ORGANIZATION_ID, role: 'MEMBER' },
      { taskId: TASK_ID },
    ),
    (error: unknown) =>
      error instanceof ApplicationError && error.code === 'NOT_FOUND',
  );
});

function taskFixture(
  organization: OrganizationId,
  id: TaskId,
  name: string,
): Task {
  return {
    id,
    organizationId: organization,
    milestoneId: milestoneId('milestone-1'),
    name,
    status: 'TODO',
    priority: 'MEDIUM',
    createdAt: NOW,
    updatedAt: NOW,
  };
}
