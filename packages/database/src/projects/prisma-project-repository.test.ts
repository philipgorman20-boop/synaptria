import assert from 'node:assert/strict';
import test from 'node:test';

import { Prisma } from '@prisma/client';
import {
  identifier,
  organizationId,
  programId,
  projectId,
  userId,
} from '@synaptria/core';
import { CoreError, NotFoundError } from '@synaptria/core/errors';

import { PrismaProjectRepository, mapProject } from './prisma-project-repository';

const NOW = new Date('2026-07-22T12:00:00.000Z');
const ORGANIZATION_ID = organizationId('org-1');
const OTHER_ORGANIZATION_ID = organizationId('org-2');
const PROGRAM_ID = programId('program-1');
const PROJECT_ID = projectId('project-1');
const OWNER_ID = userId('user-1');

function projectRow(
  overrides: Partial<Record<string, unknown>> = {},
): Record<string, unknown> {
  return {
    id: 'project-1',
    organizationId: 'org-1',
    programId: 'program-1',
    ownerId: 'user-1',
    name: 'Lead Candidate Study',
    code: 'LC-001',
    description: 'Primary study',
    status: 'PLANNED',
    priority: 'MEDIUM',
    percentComplete: 0,
    startDate: null,
    targetEndDate: null,
    completedAt: null,
    deletedAt: null,
    createdAt: NOW,
    updatedAt: NOW,
    ...overrides,
  };
}

test('PrismaProjectRepository creates a project scoped to the organization', async () => {
  let captured: Record<string, unknown> | undefined;
  const client = {
    project: {
      create: async (args: { data: Record<string, unknown>; select: unknown }) => {
        captured = args.data;
        return projectRow();
      },
    },
  };

  const repository = new PrismaProjectRepository(client as never);
  const project = await repository.create({
    organizationId: ORGANIZATION_ID,
    ownerId: OWNER_ID,
    programId: PROGRAM_ID,
    name: 'Lead Candidate Study',
    code: 'LC-001',
    description: 'Primary study',
    status: 'ACTIVE',
    priority: 'HIGH',
    percentComplete: 25,
  });

  assert.equal(captured?.organizationId, 'org-1');
  assert.equal(captured?.ownerId, 'user-1');
  assert.equal(captured?.programId, 'program-1');
  assert.equal(captured?.name, 'Lead Candidate Study');
  assert.equal(captured?.code, 'LC-001');
  assert.equal(captured?.status, 'ACTIVE');
  assert.equal(captured?.priority, 'HIGH');
  assert.equal(captured?.percentComplete, 25);
  assert.equal(project.id, PROJECT_ID);
  assert.equal(project.organizationId, ORGANIZATION_ID);
  assert.equal(project.programId, PROGRAM_ID);
  assert.equal(project.ownerId, OWNER_ID);
  assert.equal(project.percentComplete, 0);
});

test('PrismaProjectRepository create persists optional programId only when supplied', async () => {
  let captured: Record<string, unknown> | undefined;
  const client = {
    project: {
      create: async (args: { data: Record<string, unknown>; select: unknown }) => {
        captured = args.data;
        return projectRow({ programId: null });
      },
    },
  };

  const repository = new PrismaProjectRepository(client as never);
  await repository.create({
    organizationId: ORGANIZATION_ID,
    name: 'Standalone Project',
  });

  assert.equal(captured?.programId, undefined);
});

test('PrismaProjectRepository create does not apply repository-side business defaults', async () => {
  let captured: Record<string, unknown> | undefined;
  const client = {
    project: {
      create: async (args: { data: Record<string, unknown>; select: unknown }) => {
        captured = args.data;
        return projectRow();
      },
    },
  };

  const repository = new PrismaProjectRepository(client as never);
  await repository.create({
    organizationId: ORGANIZATION_ID,
    name: 'Lead Candidate Study',
  });

  assert.equal(captured?.status, undefined);
  assert.equal(captured?.priority, undefined);
  assert.equal(captured?.percentComplete, undefined);
});

test('PrismaProjectRepository findById scopes by organizationId and excludes soft-deleted rows', async () => {
  let capturedWhere: Record<string, unknown> | undefined;
  const client = {
    project: {
      findFirst: async (args: { where: Record<string, unknown>; select: unknown }) => {
        capturedWhere = args.where;
        return projectRow();
      },
    },
  };

  const repository = new PrismaProjectRepository(client as never);
  const project = await repository.findById(ORGANIZATION_ID, PROJECT_ID);

  assert.deepEqual(capturedWhere, {
    organizationId: ORGANIZATION_ID,
    deletedAt: null,
    id: PROJECT_ID,
  });
  assert.equal(project?.name, 'Lead Candidate Study');
});

test('PrismaProjectRepository findById returns null for another organization', async () => {
  const client = {
    project: {
      findFirst: async () => null,
    },
  };

  const repository = new PrismaProjectRepository(client as never);
  const project = await repository.findById(OTHER_ORGANIZATION_ID, PROJECT_ID);

  assert.equal(project, null);
});

test('PrismaProjectRepository listForOrganization scopes reads to the active organization', async () => {
  let capturedWhere: Record<string, unknown> | undefined;
  const client = {
    project: {
      findMany: async (args: {
        where: Record<string, unknown>;
        select: unknown;
        orderBy: unknown;
      }) => {
        capturedWhere = args.where;
        return [
          projectRow(),
          projectRow({ id: 'project-2', name: 'Beta Project', code: 'BETA-001' }),
        ];
      },
    },
  };

  const repository = new PrismaProjectRepository(client as never);
  const projects = await repository.listForOrganization(ORGANIZATION_ID);

  assert.deepEqual(capturedWhere, {
    organizationId: ORGANIZATION_ID,
    deletedAt: null,
  });
  assert.equal(projects.length, 2);
  assert.equal(projects[0]?.organizationId, ORGANIZATION_ID);
});

test('PrismaProjectRepository listForProgram scopes by organizationId and programId', async () => {
  let capturedWhere: Record<string, unknown> | undefined;
  const client = {
    project: {
      findMany: async (args: {
        where: Record<string, unknown>;
        select: unknown;
        orderBy: unknown;
      }) => {
        capturedWhere = args.where;
        return [projectRow()];
      },
    },
  };

  const repository = new PrismaProjectRepository(client as never);
  const projects = await repository.listForProgram(ORGANIZATION_ID, PROGRAM_ID);

  assert.deepEqual(capturedWhere, {
    organizationId: ORGANIZATION_ID,
    deletedAt: null,
    programId: PROGRAM_ID,
  });
  assert.equal(projects.length, 1);
  assert.equal(projects[0]?.programId, PROGRAM_ID);
});

test('PrismaProjectRepository findByName and findByCode enforce organization scoping', async () => {
  const calls: Record<string, unknown>[] = [];
  const client = {
    project: {
      findFirst: async (args: { where: Record<string, unknown> }) => {
        calls.push(args.where);
        return null;
      },
    },
  };

  const repository = new PrismaProjectRepository(client as never);
  await repository.findByName(ORGANIZATION_ID, 'Lead Candidate Study');
  await repository.findByCode(ORGANIZATION_ID, 'LC-001');

  assert.deepEqual(calls[0], {
    organizationId: ORGANIZATION_ID,
    deletedAt: null,
    name: 'Lead Candidate Study',
  });
  assert.deepEqual(calls[1], {
    organizationId: ORGANIZATION_ID,
    deletedAt: null,
    code: 'LC-001',
  });
});

test('PrismaProjectRepository maps duplicate name unique constraint violations to conflicts', async () => {
  const client = {
    project: {
      create: async () => {
        throw new Prisma.PrismaClientKnownRequestError('Unique constraint failed', {
          code: 'P2002',
          clientVersion: '6.12.0',
          meta: { target: ['organizationId', 'name'] },
        });
      },
    },
  };

  const repository = new PrismaProjectRepository(client as never);

  await assert.rejects(
    repository.create({
      organizationId: ORGANIZATION_ID,
      name: 'Lead Candidate Study',
    }),
    (error: unknown) =>
      error instanceof CoreError &&
      error.code === 'CONFLICT' &&
      error.details?.field === 'name',
  );
});

test('PrismaProjectRepository maps duplicate code unique constraint violations to conflicts', async () => {
  const client = {
    project: {
      create: async () => {
        throw new Prisma.PrismaClientKnownRequestError('Unique constraint failed', {
          code: 'P2002',
          clientVersion: '6.12.0',
          meta: { target: ['organizationId', 'code'] },
        });
      },
    },
  };

  const repository = new PrismaProjectRepository(client as never);

  await assert.rejects(
    repository.create({
      organizationId: ORGANIZATION_ID,
      name: 'Lead Candidate Study',
      code: 'LC-001',
    }),
    (error: unknown) =>
      error instanceof CoreError &&
      error.code === 'CONFLICT' &&
      error.details?.field === 'code',
  );
});

test('PrismaProjectRepository update throws not found when the project is outside the tenant', async () => {
  const client = {
    project: {
      findFirst: async () => null,
      update: async () => {
        throw new Error('update should not be called');
      },
    },
  };

  const repository = new PrismaProjectRepository(client as never);

  await assert.rejects(
    repository.update(ORGANIZATION_ID, PROJECT_ID, { name: 'Updated Project' }),
    NotFoundError,
  );
});

test('PrismaProjectRepository softDelete throws not found when the project is outside the tenant', async () => {
  const client = {
    project: {
      findFirst: async () => null,
      update: async () => {
        throw new Error('update should not be called');
      },
    },
  };

  const repository = new PrismaProjectRepository(client as never);

  await assert.rejects(
    repository.softDelete(ORGANIZATION_ID, PROJECT_ID, NOW),
    NotFoundError,
  );
});

test('PrismaProjectRepository softDelete throws not found for soft-deleted projects', async () => {
  const client = {
    project: {
      findFirst: async () => null,
      update: async () => {
        throw new Error('update should not be called');
      },
    },
  };

  const repository = new PrismaProjectRepository(client as never);

  await assert.rejects(
    repository.softDelete(ORGANIZATION_ID, PROJECT_ID, NOW),
    NotFoundError,
  );
});

test('mapProject converts nullable Prisma fields into optional domain properties', () => {
  const project = mapProject(
    projectRow({
      programId: null,
      ownerId: null,
      code: null,
      description: null,
      startDate: null,
      targetEndDate: null,
      completedAt: null,
      deletedAt: NOW,
    }) as never,
  );

  assert.equal(project.programId, undefined);
  assert.equal(project.ownerId, undefined);
  assert.equal(project.code, undefined);
  assert.equal(project.description, undefined);
  assert.equal(project.startDate, undefined);
  assert.equal(project.targetEndDate, undefined);
  assert.equal(project.completedAt, undefined);
  assert.equal(project.deletedAt?.toISOString(), NOW.toISOString());
  assert.equal(project.id, identifier('project-1', 'ProjectId'));
  assert.equal(project.percentComplete, 0);
});
