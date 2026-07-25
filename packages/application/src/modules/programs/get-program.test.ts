import assert from 'node:assert/strict';
import test from 'node:test';

import {
  organizationId,
  programId,
  type OrganizationId,
  type ProgramId,
} from '@synaptria/core';
import type {
  CreateProgramInput,
  Program,
  ProgramRepository,
  UpdateProgramInput,
} from '@synaptria/domain/programs';

import { ApplicationError } from '../../shared/application-error';
import { GetProgramUseCase } from './get-program';

const ORGANIZATION_ID = organizationId('org-1');
const OTHER_ORGANIZATION_ID = organizationId('org-2');
const PROGRAM_ID = programId('program-1');
const NOW = new Date('2026-07-22T16:00:00.000Z');

class InMemoryProgramRepository implements ProgramRepository {
  constructor(readonly program: Program | null) {}

  async findById(
    organizationId: OrganizationId,
    id: ProgramId,
  ): Promise<Program | null> {
    if (this.program === null) {
      return null;
    }

    if (
      this.program.organizationId !== organizationId ||
      this.program.id !== id
    ) {
      return null;
    }

    return this.program;
  }

  async create(_input: CreateProgramInput): Promise<Program> {
    throw new Error('Not implemented in this test.');
  }

  async findByName(): Promise<Program | null> {
    return null;
  }

  async findByCode(): Promise<Program | null> {
    return null;
  }

  async update(
    _organizationId: OrganizationId,
    _id: ProgramId,
    _input: UpdateProgramInput,
  ): Promise<Program> {
    throw new Error('Not implemented in this test.');
  }

  async softDelete(): Promise<Program> {
    throw new Error('Not implemented in this test.');
  }

  async listForOrganization(): Promise<readonly Program[]> {
    return [];
  }
}

test('returns a program within the active organization', async () => {
  const program = programFixture(ORGANIZATION_ID, PROGRAM_ID, 'Alpha Program');
  const useCase = new GetProgramUseCase(
    new InMemoryProgramRepository(program),
  );

  const output = await useCase.execute(
    { organizationId: ORGANIZATION_ID, role: 'VIEWER' },
    { programId: PROGRAM_ID },
  );

  assert.equal(output.program.id, PROGRAM_ID);
});

test('returns not found when the program does not exist', async () => {
  const useCase = new GetProgramUseCase(new InMemoryProgramRepository(null));

  await assert.rejects(
    useCase.execute(
      { organizationId: ORGANIZATION_ID, role: 'MEMBER' },
      { programId: PROGRAM_ID },
    ),
    (error: unknown) =>
      error instanceof ApplicationError && error.code === 'NOT_FOUND',
  );
});

test('returns not found when the program belongs to another organization', async () => {
  const program = programFixture(OTHER_ORGANIZATION_ID, PROGRAM_ID, 'Other Org');
  const useCase = new GetProgramUseCase(
    new InMemoryProgramRepository(program),
  );

  await assert.rejects(
    useCase.execute(
      { organizationId: ORGANIZATION_ID, role: 'MEMBER' },
      { programId: PROGRAM_ID },
    ),
    (error: unknown) =>
      error instanceof ApplicationError && error.code === 'NOT_FOUND',
  );
});

test('returns not found for soft-deleted programs', async () => {
  const program = programFixture(ORGANIZATION_ID, PROGRAM_ID, 'Deleted Program', {
    deletedAt: NOW,
  });
  const useCase = new GetProgramUseCase(
    new InMemoryProgramRepository(program),
  );

  await assert.rejects(
    useCase.execute(
      { organizationId: ORGANIZATION_ID, role: 'MEMBER' },
      { programId: PROGRAM_ID },
    ),
    (error: unknown) =>
      error instanceof ApplicationError && error.code === 'NOT_FOUND',
  );
});

function programFixture(
  organization: OrganizationId,
  id: ProgramId,
  name: string,
  options: Readonly<{ deletedAt?: Date }> = {},
): Program {
  return {
    id,
    organizationId: organization,
    name,
    status: 'CONCEPT',
    priority: 'MEDIUM',
    ...(options.deletedAt === undefined ? {} : { deletedAt: options.deletedAt }),
    createdAt: NOW,
    updatedAt: NOW,
  };
}
