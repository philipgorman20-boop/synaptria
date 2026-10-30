import assert from 'node:assert/strict';
import test from 'node:test';

import {
  milestoneId,
  organizationId,
  projectId,
  taskId,
  type MilestoneId,
  type OrganizationId,
} from '@synaptria/core';
import type {
  CreateMilestoneInput,
  Milestone,
  MilestoneRepository,
  UpdateMilestoneInput,
} from '@synaptria/domain/milestones';
import type {
  CreateTaskInput,
  Task,
  TaskRepository,
  UpdateTaskInput,
} from '@synaptria/domain/tasks';

import { ApplicationError } from '../../shared/application-error';
import { ListMilestoneTasksUseCase } from './list-milestone-tasks';

const ORGANIZATION_ID = organizationId('org-1');
const OTHER_ORGANIZATION_ID = organizationId('org-2');
const MILESTONE_ID = milestoneId('milestone-1');
const OTHER_MILESTONE_ID = milestoneId('milestone-other');
const NOW = new Date('2026-07-26T16:00:00.000Z');

class InMemoryTaskRepository implements TaskRepository {
  constructor(readonly tasks: readonly Task[]) {}

  async listForMilestone(
    organizationId: OrganizationId,
    milestoneId: MilestoneId,
  ): Promise<readonly Task[]> {
    return this.tasks.filter(
      (task) =>
        task.organizationId === organizationId &&
        task.milestoneId === milestoneId,
    );
  }

  async create(_input: CreateTaskInput): Promise<Task> {
    throw new Error('Not implemented in this test.');
  }

  async findById(): Promise<Task | null> {
    return null;
  }

  async update(): Promise<Task> {
    throw new Error('Not implemented in this test.');
  }

  async listForOrganization(): Promise<readonly Task[]> {
    return [];
  }
}

class InMemoryMilestoneRepository implements MilestoneRepository {
  constructor(readonly milestone: Milestone | null) {}

  async findById(
    organizationId: OrganizationId,
    id: MilestoneId,
  ): Promise<Milestone | null> {
    if (this.milestone === null) {
      return null;
    }

    if (
      this.milestone.organizationId !== organizationId ||
      this.milestone.id !== id
    ) {
      return null;
    }

    return this.milestone;
  }

  async create(_input: CreateMilestoneInput): Promise<Milestone> {
    throw new Error('Not implemented in this test.');
  }

  async update(
    _organizationId: OrganizationId,
    _id: MilestoneId,
    _input: UpdateMilestoneInput,
  ): Promise<Milestone> {
    throw new Error('Not implemented in this test.');
  }

  async listForOrganization(): Promise<readonly Milestone[]> {
    return [];
  }

  async listForProject(): Promise<readonly Milestone[]> {
    return [];
  }
}

test('lists tasks for a valid milestone alphabetically', async () => {
  const repository = new InMemoryTaskRepository([
    task(ORGANIZATION_ID, MILESTONE_ID, 'task-b', 'Beta Task'),
    task(ORGANIZATION_ID, MILESTONE_ID, 'task-a', 'Alpha Task'),
    task(ORGANIZATION_ID, OTHER_MILESTONE_ID, 'task-other', 'Other Milestone Task'),
  ]);
  const useCase = new ListMilestoneTasksUseCase(
    repository,
    new InMemoryMilestoneRepository(
      milestoneFixture(ORGANIZATION_ID, MILESTONE_ID),
    ),
  );

  const output = await useCase.execute(
    { organizationId: ORGANIZATION_ID, role: 'MEMBER' },
    { milestoneId: MILESTONE_ID },
  );

  assert.deepEqual(
    output.tasks.map((item) => item.id),
    [taskId('task-a'), taskId('task-b')],
  );
});

test('returns not found when the parent milestone does not exist', async () => {
  const useCase = new ListMilestoneTasksUseCase(
    new InMemoryTaskRepository([]),
    new InMemoryMilestoneRepository(null),
  );

  await assert.rejects(
    useCase.execute(
      { organizationId: ORGANIZATION_ID, role: 'MEMBER' },
      { milestoneId: MILESTONE_ID },
    ),
    (error: unknown) =>
      error instanceof ApplicationError && error.code === 'NOT_FOUND',
  );
});

test('returns not found when the parent milestone belongs to another organization', async () => {
  const useCase = new ListMilestoneTasksUseCase(
    new InMemoryTaskRepository([]),
    new InMemoryMilestoneRepository(
      milestoneFixture(OTHER_ORGANIZATION_ID, MILESTONE_ID),
    ),
  );

  await assert.rejects(
    useCase.execute(
      { organizationId: ORGANIZATION_ID, role: 'MEMBER' },
      { milestoneId: MILESTONE_ID },
    ),
    (error: unknown) =>
      error instanceof ApplicationError && error.code === 'NOT_FOUND',
  );
});

function task(
  organization: OrganizationId,
  milestone: MilestoneId,
  id: string,
  name: string,
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

function milestoneFixture(
  organization: OrganizationId,
  id: MilestoneId,
): Milestone {
  return {
    id,
    organizationId: organization,
    projectId: projectId('project-1'),
    name: 'Phase 1 Gate',
    status: 'PLANNED',
    priority: 'MEDIUM',
    createdAt: NOW,
    updatedAt: NOW,
  };
}
