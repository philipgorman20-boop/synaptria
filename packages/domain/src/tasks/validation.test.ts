import assert from 'node:assert/strict';
import test from 'node:test';

import { CoreError } from '@synaptria/core';
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
  TaskRepository,
  UpdateTaskInput,
} from './task-repository';
import type { Task } from './models';
import {
  DEFAULT_TASK_PRIORITY,
  DEFAULT_TASK_STATUS,
  applyCreateTaskDefaults,
  normalizeCreateTaskInput,
  normalizeUpdateTaskInput,
} from './validation';

const ORGANIZATION_ID = organizationId('org-1');
const MILESTONE_ID = milestoneId('milestone-1');
const TASK_ID = taskId('task-1');
const NOW = new Date('2026-07-26T16:00:00.000Z');

function createInput(
  overrides: Partial<CreateTaskInput> = {},
): CreateTaskInput {
  return {
    organizationId: ORGANIZATION_ID,
    milestoneId: MILESTONE_ID,
    name: 'Prepare assay protocol',
    ...overrides,
  };
}

function taskFixture(overrides: Partial<Task> = {}): Task {
  return {
    id: TASK_ID,
    organizationId: ORGANIZATION_ID,
    milestoneId: MILESTONE_ID,
    name: 'Prepare assay protocol',
    status: 'TODO',
    priority: 'MEDIUM',
    createdAt: NOW,
    updatedAt: NOW,
    ...overrides,
  };
}

class InMemoryTaskRepository implements TaskRepository {
  readonly createdInputs: CreateTaskInput[] = [];
  readonly updatedInputs: UpdateTaskInput[] = [];

  async create(input: CreateTaskInput): Promise<Task> {
    this.createdInputs.push(input);
    return taskFixture({
      name: input.name,
      ...(input.description === undefined ? {} : { description: input.description }),
      status: input.status ?? DEFAULT_TASK_STATUS,
      priority: input.priority ?? DEFAULT_TASK_PRIORITY,
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
    });
  }

  async findById(
    organizationId: OrganizationId,
    id: TaskId,
  ): Promise<Task | null> {
    const task = taskFixture();
    if (task.organizationId !== organizationId || task.id !== id) {
      return null;
    }
    return task;
  }

  async update(
    _organizationId: OrganizationId,
    _id: TaskId,
    input: UpdateTaskInput,
  ): Promise<Task> {
    this.updatedInputs.push(input);
    return taskFixture();
  }

  async listForOrganization(): Promise<readonly Task[]> {
    return [];
  }

  async listForMilestone(): Promise<readonly Task[]> {
    return [];
  }
}

test('normalizeCreateTaskInput accepts a valid task payload', () => {
  const normalized = normalizeCreateTaskInput(
    createInput({
      description: '  Draft review package  ',
      status: 'IN_PROGRESS',
      priority: 'HIGH',
      plannedStartDate: new Date('2026-08-01T00:00:00.000Z'),
      plannedEndDate: new Date('2026-08-31T00:00:00.000Z'),
    }),
  );

  assert.equal(normalized.name, 'Prepare assay protocol');
  assert.equal(normalized.description, 'Draft review package');
  assert.equal(normalized.status, 'IN_PROGRESS');
  assert.equal(normalized.priority, 'HIGH');
});

test('applyCreateTaskDefaults applies TODO and MEDIUM when omitted', () => {
  const normalized = normalizeCreateTaskInput(createInput());
  const withDefaults = applyCreateTaskDefaults(normalized);

  assert.equal(withDefaults.status, 'TODO');
  assert.equal(withDefaults.priority, 'MEDIUM');
});

test('applyCreateTaskDefaults preserves explicit status and priority', () => {
  const normalized = normalizeCreateTaskInput(
    createInput({ status: 'BLOCKED', priority: 'CRITICAL' }),
  );
  const withDefaults = applyCreateTaskDefaults(normalized);

  assert.equal(withDefaults.status, 'BLOCKED');
  assert.equal(withDefaults.priority, 'CRITICAL');
});

test('normalizeCreateTaskInput trims whitespace from the task name', () => {
  const normalized = normalizeCreateTaskInput(
    createInput({ name: '  Prepare assay protocol  ' }),
  );

  assert.equal(normalized.name, 'Prepare assay protocol');
});

test('normalizeCreateTaskInput rejects blank task names', () => {
  assert.throws(
    () => normalizeCreateTaskInput(createInput({ name: '   ' })),
    (error: unknown) => {
      assert.ok(error instanceof CoreError);
      assert.equal(error.code, 'VALIDATION_FAILED');
      assert.equal(error.details?.field, 'name');
      return true;
    },
  );
});

test('normalizeCreateTaskInput rejects invalid planned date ranges', () => {
  assert.throws(
    () =>
      normalizeCreateTaskInput(
        createInput({
          plannedStartDate: new Date('2026-09-01T00:00:00.000Z'),
          plannedEndDate: new Date('2026-08-01T00:00:00.000Z'),
        }),
      ),
    (error: unknown) => {
      assert.ok(error instanceof CoreError);
      assert.equal(error.details?.field, 'plannedStartDate');
      return true;
    },
  );
});

test('normalizeCreateTaskInput rejects invalid Date objects', () => {
  assert.throws(
    () =>
      normalizeCreateTaskInput(
        createInput({
          plannedStartDate: new Date('invalid'),
        }),
      ),
    (error: unknown) => {
      assert.ok(error instanceof CoreError);
      assert.equal(error.details?.field, 'plannedStartDate');
      return true;
    },
  );
});

test('normalizeCreateTaskInput rejects invalid actual date ranges', () => {
  assert.throws(
    () =>
      normalizeCreateTaskInput(
        createInput({
          actualStartDate: new Date('2026-09-01T00:00:00.000Z'),
          actualEndDate: new Date('2026-08-01T00:00:00.000Z'),
        }),
      ),
    (error: unknown) => {
      assert.ok(error instanceof CoreError);
      assert.equal(error.details?.field, 'actualStartDate');
      return true;
    },
  );
});

test('normalizeCreateTaskInput rejects unsupported status values', () => {
  assert.throws(
    () =>
      normalizeCreateTaskInput(
        createInput({ status: 'INVALID' as never }),
      ),
    (error: unknown) => {
      assert.ok(error instanceof CoreError);
      assert.equal(error.details?.field, 'status');
      return true;
    },
  );
});

test('normalizeCreateTaskInput rejects unsupported priority values', () => {
  assert.throws(
    () =>
      normalizeCreateTaskInput(
        createInput({ priority: 'URGENT' as never }),
      ),
    (error: unknown) => {
      assert.ok(error instanceof CoreError);
      assert.equal(error.details?.field, 'priority');
      return true;
    },
  );
});

test('normalizeUpdateTaskInput validates partial updates', () => {
  const normalized = normalizeUpdateTaskInput({
    name: '  Updated task name  ',
    status: 'COMPLETED',
  });

  assert.equal(normalized.name, 'Updated task name');
  assert.equal(normalized.status, 'COMPLETED');
  assert.equal(normalized.priority, undefined);
});

test('normalizeUpdateTaskInput trims description whitespace', () => {
  const normalized = normalizeUpdateTaskInput({
    description: '  Updated description  ',
  });

  assert.equal(normalized.description, 'Updated description');
});

test('normalizeUpdateTaskInput preserves null description clearing', () => {
  const normalized = normalizeUpdateTaskInput({
    description: null,
  });

  assert.equal(normalized.description, null);
});

test('normalizeUpdateTaskInput allows clearing optional date fields', () => {
  const normalized = normalizeUpdateTaskInput({
    plannedStartDate: null,
    plannedEndDate: null,
  });

  assert.equal(normalized.plannedStartDate, null);
  assert.equal(normalized.plannedEndDate, null);
});

test('normalizeUpdateTaskInput rejects invalid Date objects', () => {
  assert.throws(
    () =>
      normalizeUpdateTaskInput({
        actualEndDate: new Date('invalid'),
      }),
    (error: unknown) => {
      assert.ok(error instanceof CoreError);
      assert.equal(error.details?.field, 'actualEndDate');
      return true;
    },
  );
});

test('TaskRepository contract accepts normalized create input', async () => {
  const repository: TaskRepository = new InMemoryTaskRepository();
  const normalized = applyCreateTaskDefaults(normalizeCreateTaskInput(createInput()));

  const task = await repository.create({
    organizationId: normalized.organizationId,
    milestoneId: normalized.milestoneId,
    name: normalized.name,
    status: normalized.status,
    priority: normalized.priority,
  });

  assert.equal(task.organizationId, ORGANIZATION_ID);
  assert.equal(task.milestoneId, MILESTONE_ID);
  assert.equal(task.status, 'TODO');
  assert.equal(task.priority, 'MEDIUM');
});

test('TaskRepository contract scopes findById by organization', async () => {
  const repository: TaskRepository = new InMemoryTaskRepository();

  const found = await repository.findById(ORGANIZATION_ID, TASK_ID);
  const missing = await repository.findById(
    organizationId('other-org'),
    TASK_ID,
  );

  assert.notEqual(found, null);
  assert.equal(missing, null);
});
