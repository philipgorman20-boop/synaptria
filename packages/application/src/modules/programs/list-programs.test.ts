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

import { ListProgramsUseCase } from './list-programs';

const ORGANIZATION_ID = organizationId('org-1');
const OTHER_ORGANIZATION_ID = organizationId('org-2');
const NOW = new Date('2026-07-22T16:00:00.000Z');

class InMemoryProgramRepository implements ProgramRepository {
  constructor(readonly programs: readonly Program[]) {}

  async listForOrganization(
    organizationId: OrganizationId,
  ): Promise<readonly Program[]> {
    return this.programs.filter(
      (program) => program.organizationId === organizationId,
    );
  }

  async create(_input: CreateProgramInput): Promise<Program> {
    throw new Error('Not implemented in this test.');
  }

  async findById(): Promise<Program | null> {
    return null;
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
}

test('lists programs for the active organization alphabetically', async () => {
  const repository = new InMemoryProgramRepository([
    program(ORGANIZATION_ID, 'program-b', 'Beta Program', 'BETA'),
    program(ORGANIZATION_ID, 'program-a', 'Alpha Program', 'ALPHA'),
    program(OTHER_ORGANIZATION_ID, 'program-other', 'Other Org Program'),
  ]);
  const useCase = new ListProgramsUseCase(repository);

  const output = await useCase.execute({
    organizationId: ORGANIZATION_ID,
    role: 'MEMBER',
  });

  assert.deepEqual(
    output.programs.map((item) => item.id),
    [programId('program-a'), programId('program-b')],
  );
});

test('returns an empty result when the organization has no programs', async () => {
  const useCase = new ListProgramsUseCase(new InMemoryProgramRepository([]));

  const output = await useCase.execute({
    organizationId: ORGANIZATION_ID,
    role: 'VIEWER',
  });

  assert.deepEqual(output, { programs: [] });
});

test('defensively excludes soft-deleted programs', async () => {
  const deleted = program(ORGANIZATION_ID, 'program-deleted', 'Deleted Program', undefined, {
    deletedAt: NOW,
  });
  const active = program(ORGANIZATION_ID, 'program-active', 'Active Program');
  const useCase = new ListProgramsUseCase(
    new InMemoryProgramRepository([deleted, active]),
  );

  const output = await useCase.execute({
    organizationId: ORGANIZATION_ID,
    role: 'MEMBER',
  });

  assert.equal(output.programs.length, 1);
  assert.equal(output.programs[0]?.id, programId('program-active'));
});

test('does not return programs from another organization', async () => {
  const useCase = new ListProgramsUseCase(
    new InMemoryProgramRepository([
      program(OTHER_ORGANIZATION_ID, 'program-other', 'Other Org Program'),
    ]),
  );

  const output = await useCase.execute({
    organizationId: ORGANIZATION_ID,
    role: 'MEMBER',
  });

  assert.deepEqual(output, { programs: [] });
});

test('allows viewers to list programs when they have programs.read permission', async () => {
  const useCase = new ListProgramsUseCase(
    new InMemoryProgramRepository([
      program(ORGANIZATION_ID, 'program-a', 'Alpha Program'),
    ]),
  );

  const output = await useCase.execute({
    organizationId: ORGANIZATION_ID,
    role: 'VIEWER',
  });

  assert.equal(output.programs.length, 1);
});

function program(
  organization: OrganizationId,
  id: string,
  name: string,
  code?: string,
  options: Readonly<{ deletedAt?: Date }> = {},
): Program {
  return {
    id: programId(id),
    organizationId: organization,
    name,
    ...(code === undefined ? {} : { code }),
    status: 'CONCEPT',
    priority: 'MEDIUM',
    ...(options.deletedAt === undefined ? {} : { deletedAt: options.deletedAt }),
    createdAt: NOW,
    updatedAt: NOW,
  };
}
