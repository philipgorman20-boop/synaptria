import assert from 'node:assert/strict';
import test from 'node:test';

import {
  identifier,
  milestoneId,
  organizationId,
  taskId,
} from '@synaptria/core';
import { NotFoundError } from '@synaptria/core/errors';

import { PrismaTaskRepository, mapTask } from './prisma-task-repository';

const NOW = new Date('2026-07-26T12:00:00.000Z');
const ORGANIZATION_ID = organizationId('org-1');
const OTHER_ORGANIZATION_ID = organizationId('org-2');
const MILESTONE_ID = milestoneId('milestone-1');
const OTHER_MILESTONE_ID = milestoneId('milestone-2');
const TASK_ID = taskId('task-1');

function taskRow(
  overrides: Partial<Record<string, unknown>> = {},
): Record<string, unknown> {
  return {
    id: 'task-1',
    organizationId: 'org-1',
    milestoneId: 'milestone-1',
    name: 'Prepare assay protocol',
    description: 'Initial draft',
    status: 'TODO',
    priority: 'MEDIUM',
    plannedStartDate: null,
    plannedEndDate: null,
    actualStartDate: null,
    actualEndDate: null,
    createdAt: NOW,
    updatedAt: NOW,
    ...overrides,
  };
}

test('PrismaTaskRepository creates a task scoped to the organization and milestone', async () => {
  let captured: Record<string, unknown> | undefined;
  const client = {
    task: {
      create: async (args: { data: Record<string, unknown>; select: unknown }) => {
        captured = args.data;
        return taskRow();
      },
    },
  };

  const repository = new PrismaTaskRepository(client as never);
  const task = await repository.create({
    organizationId: ORGANIZATION_ID,
    milestoneId: MILESTONE_ID,
    name: 'Prepare assay protocol',
    description: 'Initial draft',
    status: 'IN_PROGRESS',
    priority: 'HIGH',
    plannedStartDate: NOW,
    plannedEndDate: NOW,
  });

  assert.equal(captured?.organizationId, 'org-1');
  assert.equal(captured?.milestoneId, 'milestone-1');
  assert.equal(captured?.name, 'Prepare assay protocol');
  assert.equal(captured?.description, 'Initial draft');
  assert.equal(captured?.status, 'IN_PROGRESS');
  assert.equal(captured?.priority, 'HIGH');
  assert.equal(captured?.plannedStartDate, NOW);
  assert.equal(captured?.plannedEndDate, NOW);
  assert.equal(task.id, TASK_ID);
  assert.equal(task.organizationId, ORGANIZATION_ID);
  assert.equal(task.milestoneId, MILESTONE_ID);
});

test('PrismaTaskRepository create does not apply repository-side business defaults', async () => {
  let captured: Record<string, unknown> | undefined;
  const client = {
    task: {
      create: async (args: { data: Record<string, unknown>; select: unknown }) => {
        captured = args.data;
        return taskRow();
      },
    },
  };

  const repository = new PrismaTaskRepository(client as never);
  await repository.create({
    organizationId: ORGANIZATION_ID,
    milestoneId: MILESTONE_ID,
    name: 'Prepare assay protocol',
  });

  assert.equal(captured?.status, undefined);
  assert.equal(captured?.priority, undefined);
});

test('PrismaTaskRepository create persists application defaults when supplied', async () => {
  let captured: Record<string, unknown> | undefined;
  const client = {
    task: {
      create: async (args: { data: Record<string, unknown>; select: unknown }) => {
        captured = args.data;
        return taskRow({ status: 'TODO', priority: 'MEDIUM' });
      },
    },
  };

  const repository = new PrismaTaskRepository(client as never);
  const task = await repository.create({
    organizationId: ORGANIZATION_ID,
    milestoneId: MILESTONE_ID,
    name: 'Prepare assay protocol',
    status: 'TODO',
    priority: 'MEDIUM',
  });

  assert.equal(captured?.status, 'TODO');
  assert.equal(captured?.priority, 'MEDIUM');
  assert.equal(task.status, 'TODO');
  assert.equal(task.priority, 'MEDIUM');
});

test('PrismaTaskRepository findById scopes by organizationId and excludes soft-deleted rows', async () => {
  let capturedWhere: Record<string, unknown> | undefined;
  const client = {
    task: {
      findFirst: async (args: { where: Record<string, unknown>; select: unknown }) => {
        capturedWhere = args.where;
        return taskRow();
      },
    },
  };

  const repository = new PrismaTaskRepository(client as never);
  const task = await repository.findById(ORGANIZATION_ID, TASK_ID);

  assert.deepEqual(capturedWhere, {
    organizationId: ORGANIZATION_ID,
    deletedAt: null,
    id: TASK_ID,
  });
  assert.equal(task?.name, 'Prepare assay protocol');
});

test('PrismaTaskRepository findById returns null for another organization', async () => {
  const client = {
    task: {
      findFirst: async () => null,
    },
  };

  const repository = new PrismaTaskRepository(client as never);
  const task = await repository.findById(OTHER_ORGANIZATION_ID, TASK_ID);

  assert.equal(task, null);
});

test('PrismaTaskRepository findById excludes soft-deleted rows', async () => {
  const client = {
    task: {
      findFirst: async () => null,
    },
  };

  const repository = new PrismaTaskRepository(client as never);
  const task = await repository.findById(ORGANIZATION_ID, TASK_ID);

  assert.equal(task, null);
});

test('PrismaTaskRepository update persists changes for active tasks', async () => {
  let capturedData: Record<string, unknown> | undefined;
  let capturedWhere: Record<string, unknown> | undefined;
  const client = {
    task: {
      findFirst: async () =>
        taskRow({
          name: 'Updated task',
          status: 'COMPLETED',
        }),
      updateMany: async (args: {
        where: Record<string, unknown>;
        data: Record<string, unknown>;
      }) => {
        capturedWhere = args.where;
        capturedData = args.data;
        return { count: 1 };
      },
    },
  };

  const repository = new PrismaTaskRepository(client as never);
  const task = await repository.update(ORGANIZATION_ID, TASK_ID, {
    name: 'Updated task',
    status: 'COMPLETED',
  });

  assert.deepEqual(capturedWhere, {
    id: TASK_ID,
    organizationId: ORGANIZATION_ID,
    deletedAt: null,
  });
  assert.equal(capturedData?.name, 'Updated task');
  assert.equal(capturedData?.status, 'COMPLETED');
  assert.equal(task.name, 'Updated task');
  assert.equal(task.status, 'COMPLETED');
});

test('PrismaTaskRepository update clears nullable fields when set to null', async () => {
  let capturedData: Record<string, unknown> | undefined;
  const client = {
    task: {
      findFirst: async () => taskRow({ description: null }),
      updateMany: async (args: {
        where: Record<string, unknown>;
        data: Record<string, unknown>;
      }) => {
        capturedData = args.data;
        return { count: 1 };
      },
    },
  };

  const repository = new PrismaTaskRepository(client as never);
  const task = await repository.update(ORGANIZATION_ID, TASK_ID, {
    description: null,
    plannedEndDate: null,
  });

  assert.equal(capturedData?.description, null);
  assert.equal(capturedData?.plannedEndDate, null);
  assert.equal(task.description, undefined);
});

test('PrismaTaskRepository update throws not found when the task is outside the tenant', async () => {
  const client = {
    task: {
      findFirst: async () => null,
      updateMany: async () => {
        throw new Error('updateMany should not be called');
      },
    },
  };

  const repository = new PrismaTaskRepository(client as never);

  await assert.rejects(
    repository.update(ORGANIZATION_ID, TASK_ID, { name: 'Updated task' }),
    NotFoundError,
  );
});

test('PrismaTaskRepository update throws not found for soft-deleted tasks', async () => {
  const client = {
    task: {
      findFirst: async () => null,
      updateMany: async () => {
        throw new Error('updateMany should not be called');
      },
    },
  };

  const repository = new PrismaTaskRepository(client as never);

  await assert.rejects(
    repository.update(ORGANIZATION_ID, TASK_ID, { name: 'Updated task' }),
    NotFoundError,
  );
});

test('PrismaTaskRepository update throws not found when the task is soft-deleted after the existence check', async () => {
  const client = {
    task: {
      findFirst: async () => taskRow(),
      updateMany: async () => ({ count: 0 }),
    },
  };

  const repository = new PrismaTaskRepository(client as never);

  await assert.rejects(
    repository.update(ORGANIZATION_ID, TASK_ID, { name: 'Updated task' }),
    NotFoundError,
  );
});

test('PrismaTaskRepository listForOrganization scopes reads to the active organization', async () => {
  let capturedWhere: Record<string, unknown> | undefined;
  const client = {
    task: {
      findMany: async (args: {
        where: Record<string, unknown>;
        select: unknown;
      }) => {
        capturedWhere = args.where;
        return [
          taskRow(),
          taskRow({ id: 'task-2', name: 'Beta Task' }),
        ];
      },
    },
  };

  const repository = new PrismaTaskRepository(client as never);
  const tasks = await repository.listForOrganization(ORGANIZATION_ID);

  assert.deepEqual(capturedWhere, {
    organizationId: ORGANIZATION_ID,
    deletedAt: null,
  });
  assert.equal(tasks.length, 2);
  assert.equal(tasks[0]?.organizationId, ORGANIZATION_ID);
});

test('PrismaTaskRepository listForOrganization excludes soft-deleted rows', async () => {
  let capturedWhere: Record<string, unknown> | undefined;
  const client = {
    task: {
      findMany: async (args: {
        where: Record<string, unknown>;
        select: unknown;
      }) => {
        capturedWhere = args.where;
        return [];
      },
    },
  };

  const repository = new PrismaTaskRepository(client as never);
  await repository.listForOrganization(ORGANIZATION_ID);

  assert.equal(capturedWhere?.deletedAt, null);
});

test('PrismaTaskRepository listForMilestone scopes by organizationId and milestoneId', async () => {
  let capturedWhere: Record<string, unknown> | undefined;
  const client = {
    task: {
      findMany: async (args: {
        where: Record<string, unknown>;
        select: unknown;
      }) => {
        capturedWhere = args.where;
        return [taskRow()];
      },
    },
  };

  const repository = new PrismaTaskRepository(client as never);
  const tasks = await repository.listForMilestone(ORGANIZATION_ID, MILESTONE_ID);

  assert.deepEqual(capturedWhere, {
    organizationId: ORGANIZATION_ID,
    deletedAt: null,
    milestoneId: MILESTONE_ID,
  });
  assert.equal(tasks.length, 1);
  assert.equal(tasks[0]?.milestoneId, MILESTONE_ID);
});

test('PrismaTaskRepository listForMilestone excludes soft-deleted rows', async () => {
  let capturedWhere: Record<string, unknown> | undefined;
  const client = {
    task: {
      findMany: async (args: {
        where: Record<string, unknown>;
        select: unknown;
      }) => {
        capturedWhere = args.where;
        return [];
      },
    },
  };

  const repository = new PrismaTaskRepository(client as never);
  await repository.listForMilestone(ORGANIZATION_ID, OTHER_MILESTONE_ID);

  assert.equal(capturedWhere?.deletedAt, null);
  assert.equal(capturedWhere?.milestoneId, OTHER_MILESTONE_ID);
});

test('mapTask converts nullable Prisma fields into optional domain properties', () => {
  const task = mapTask(
    taskRow({
      description: null,
      plannedStartDate: null,
      plannedEndDate: null,
      actualStartDate: null,
      actualEndDate: null,
    }) as never,
  );

  assert.equal(task.description, undefined);
  assert.equal(task.plannedStartDate, undefined);
  assert.equal(task.plannedEndDate, undefined);
  assert.equal(task.actualStartDate, undefined);
  assert.equal(task.actualEndDate, undefined);
  assert.equal(task.id, identifier('task-1', 'TaskId'));
  assert.equal(task.milestoneId, MILESTONE_ID);
});
