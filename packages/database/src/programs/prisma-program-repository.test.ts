import assert from 'node:assert/strict';
import test from 'node:test';

import { Prisma } from '@prisma/client';
import {
  identifier,
  organizationId,
  programId,
  userId,
} from '@synaptria/core';
import { CoreError, NotFoundError } from '@synaptria/core/errors';

import { PrismaProgramRepository, mapProgram } from './prisma-program-repository';

const NOW = new Date('2026-07-22T12:00:00.000Z');
const ORGANIZATION_ID = organizationId('org-1');
const OTHER_ORGANIZATION_ID = organizationId('org-2');
const PROGRAM_ID = programId('program-1');
const OWNER_ID = userId('user-1');

function programRow(
  overrides: Partial<Record<string, unknown>> = {},
): Record<string, unknown> {
  return {
    id: 'program-1',
    organizationId: 'org-1',
    ownerId: 'user-1',
    name: 'Oncology Portfolio',
    code: 'ONCO-001',
    description: 'Lead program',
    indication: null,
    modality: null,
    target: null,
    status: 'CONCEPT',
    priority: 'MEDIUM',
    startDate: null,
    targetEndDate: null,
    completedAt: null,
    deletedAt: null,
    createdAt: NOW,
    updatedAt: NOW,
    ...overrides,
  };
}

test('PrismaProgramRepository creates a program scoped to the organization', async () => {
  let captured: Record<string, unknown> | undefined;
  const client = {
    program: {
      create: async (args: { data: Record<string, unknown>; select: unknown }) => {
        captured = args.data;
        return programRow();
      },
    },
  };

  const repository = new PrismaProgramRepository(client as never);
  const program = await repository.create({
    organizationId: ORGANIZATION_ID,
    ownerId: OWNER_ID,
    name: 'Oncology Portfolio',
    code: 'ONCO-001',
    description: 'Lead program',
  });

  assert.equal(captured?.organizationId, 'org-1');
  assert.equal(captured?.ownerId, 'user-1');
  assert.equal(captured?.name, 'Oncology Portfolio');
  assert.equal(captured?.code, 'ONCO-001');
  assert.equal(program.id, PROGRAM_ID);
  assert.equal(program.organizationId, ORGANIZATION_ID);
  assert.equal(program.ownerId, OWNER_ID);
});

test('PrismaProgramRepository findById scopes by organizationId and excludes soft-deleted rows', async () => {
  let capturedWhere: Record<string, unknown> | undefined;
  const client = {
    program: {
      findFirst: async (args: { where: Record<string, unknown>; select: unknown }) => {
        capturedWhere = args.where;
        return programRow();
      },
    },
  };

  const repository = new PrismaProgramRepository(client as never);
  const program = await repository.findById(ORGANIZATION_ID, PROGRAM_ID);

  assert.deepEqual(capturedWhere, {
    organizationId: ORGANIZATION_ID,
    deletedAt: null,
    id: PROGRAM_ID,
  });
  assert.equal(program?.name, 'Oncology Portfolio');
});

test('PrismaProgramRepository findById returns null for another organization', async () => {
  const client = {
    program: {
      findFirst: async () => null,
    },
  };

  const repository = new PrismaProgramRepository(client as never);
  const program = await repository.findById(OTHER_ORGANIZATION_ID, PROGRAM_ID);

  assert.equal(program, null);
});

test('PrismaProgramRepository listForOrganization scopes reads to the active organization', async () => {
  let capturedWhere: Record<string, unknown> | undefined;
  const client = {
    program: {
      findMany: async (args: { where: Record<string, unknown>; select: unknown; orderBy: unknown }) => {
        capturedWhere = args.where;
        return [programRow(), programRow({ id: 'program-2', name: 'Beta Program', code: 'BETA-001' })];
      },
    },
  };

  const repository = new PrismaProgramRepository(client as never);
  const programs = await repository.listForOrganization(ORGANIZATION_ID);

  assert.deepEqual(capturedWhere, {
    organizationId: ORGANIZATION_ID,
    deletedAt: null,
  });
  assert.equal(programs.length, 2);
  assert.equal(programs[0]?.organizationId, ORGANIZATION_ID);
});

test('PrismaProgramRepository findByName and findByCode enforce organization scoping', async () => {
  const calls: Record<string, unknown>[] = [];
  const client = {
    program: {
      findFirst: async (args: { where: Record<string, unknown> }) => {
        calls.push(args.where);
        return null;
      },
    },
  };

  const repository = new PrismaProgramRepository(client as never);
  await repository.findByName(ORGANIZATION_ID, 'Oncology Portfolio');
  await repository.findByCode(ORGANIZATION_ID, 'ONCO-001');

  assert.deepEqual(calls[0], {
    organizationId: ORGANIZATION_ID,
    deletedAt: null,
    name: 'Oncology Portfolio',
  });
  assert.deepEqual(calls[1], {
    organizationId: ORGANIZATION_ID,
    deletedAt: null,
    code: 'ONCO-001',
  });
});

test('PrismaProgramRepository maps Prisma unique constraint violations to conflicts', async () => {
  const client = {
    program: {
      create: async () => {
        throw new Prisma.PrismaClientKnownRequestError('Unique constraint failed', {
          code: 'P2002',
          clientVersion: '6.12.0',
          meta: { target: ['organizationId', 'code'] },
        });
      },
    },
  };

  const repository = new PrismaProgramRepository(client as never);

  await assert.rejects(
    repository.create({
      organizationId: ORGANIZATION_ID,
      name: 'Oncology Portfolio',
      code: 'ONCO-001',
    }),
    (error: unknown) =>
      error instanceof CoreError &&
      error.code === 'CONFLICT' &&
      error.details?.field === 'code',
  );
});

test('PrismaProgramRepository update throws not found when the program is outside the tenant', async () => {
  const client = {
    program: {
      findFirst: async () => null,
      update: async () => {
        throw new Error('update should not be called');
      },
    },
  };

  const repository = new PrismaProgramRepository(client as never);

  await assert.rejects(
    repository.update(ORGANIZATION_ID, PROGRAM_ID, { name: 'Updated Program' }),
    NotFoundError,
  );
});

test('mapProgram converts nullable Prisma fields into optional domain properties', () => {
  const program = mapProgram(
    programRow({
      ownerId: null,
      code: null,
      description: null,
      deletedAt: NOW,
    }) as never,
  );

  assert.equal(program.ownerId, undefined);
  assert.equal(program.code, undefined);
  assert.equal(program.description, undefined);
  assert.equal(program.deletedAt?.toISOString(), NOW.toISOString());
  assert.equal(program.id, identifier('program-1', 'ProgramId'));
});
