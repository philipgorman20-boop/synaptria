import assert from 'node:assert/strict';
import test from 'node:test';

import {
  organizationId,
  programId,
  projectId,
  type OrganizationId,
  type ProgramId,
  type ProjectId,
} from '@synaptria/core';
import type {
  CreateProgramInput,
  Program,
  ProgramRepository,
  UpdateProgramInput,
} from '@synaptria/domain/programs';
import type {
  CreateProjectInput,
  Project,
  ProjectRepository,
  UpdateProjectInput,
} from '@synaptria/domain/projects';

import { ApplicationError } from '../../shared/application-error';
import { ListProgramProjectsUseCase } from './list-program-projects';

const ORGANIZATION_ID = organizationId('org-1');
const OTHER_ORGANIZATION_ID = organizationId('org-2');
const PROGRAM_ID = programId('program-1');
const OTHER_PROGRAM_ID = programId('program-other');
const NOW = new Date('2026-07-22T16:00:00.000Z');

class InMemoryProjectRepository implements ProjectRepository {
  constructor(readonly projects: readonly Project[]) {}

  async listForProgram(
    organizationId: OrganizationId,
    programId: ProgramId,
  ): Promise<readonly Project[]> {
    return this.projects.filter(
      (project) =>
        project.organizationId === organizationId &&
        project.programId === programId,
    );
  }

  async create(_input: CreateProjectInput): Promise<Project> {
    throw new Error('Not implemented in this test.');
  }

  async findById(): Promise<Project | null> {
    return null;
  }

  async findByName(): Promise<Project | null> {
    return null;
  }

  async findByCode(): Promise<Project | null> {
    return null;
  }

  async update(
    _organizationId: OrganizationId,
    _id: ProjectId,
    _input: UpdateProjectInput,
  ): Promise<Project> {
    throw new Error('Not implemented in this test.');
  }

  async softDelete(): Promise<Project> {
    throw new Error('Not implemented in this test.');
  }

  async listForOrganization(): Promise<readonly Project[]> {
    return [];
  }
}

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

test('lists projects for a valid program alphabetically', async () => {
  const repository = new InMemoryProjectRepository([
    project(ORGANIZATION_ID, PROGRAM_ID, 'project-b', 'Beta Project', 'BETA'),
    project(ORGANIZATION_ID, PROGRAM_ID, 'project-a', 'Alpha Project', 'ALPHA'),
    project(ORGANIZATION_ID, OTHER_PROGRAM_ID, 'project-other', 'Other Program Project'),
  ]);
  const useCase = new ListProgramProjectsUseCase(
    repository,
    new InMemoryProgramRepository(
      programFixture(ORGANIZATION_ID, PROGRAM_ID, 'Oncology Portfolio'),
    ),
  );

  const output = await useCase.execute(
    { organizationId: ORGANIZATION_ID, role: 'MEMBER' },
    { programId: PROGRAM_ID },
  );

  assert.deepEqual(
    output.projects.map((item) => item.id),
    [projectId('project-a'), projectId('project-b')],
  );
});

test('returns not found when the parent program does not exist', async () => {
  const useCase = new ListProgramProjectsUseCase(
    new InMemoryProjectRepository([]),
    new InMemoryProgramRepository(null),
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

test('returns not found when the parent program belongs to another organization', async () => {
  const useCase = new ListProgramProjectsUseCase(
    new InMemoryProjectRepository([]),
    new InMemoryProgramRepository(
      programFixture(OTHER_ORGANIZATION_ID, PROGRAM_ID, 'Other Org Program'),
    ),
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

test('returns not found when the parent program is soft-deleted', async () => {
  const useCase = new ListProgramProjectsUseCase(
    new InMemoryProjectRepository([]),
    new InMemoryProgramRepository(
      programFixture(ORGANIZATION_ID, PROGRAM_ID, 'Deleted Program', {
        deletedAt: NOW,
      }),
    ),
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

test('defensively excludes soft-deleted projects from program listing', async () => {
  const deleted = project(
    ORGANIZATION_ID,
    PROGRAM_ID,
    'project-deleted',
    'Deleted Project',
    undefined,
    { deletedAt: NOW },
  );
  const active = project(
    ORGANIZATION_ID,
    PROGRAM_ID,
    'project-active',
    'Active Project',
  );
  const useCase = new ListProgramProjectsUseCase(
    new InMemoryProjectRepository([deleted, active]),
    new InMemoryProgramRepository(
      programFixture(ORGANIZATION_ID, PROGRAM_ID, 'Oncology Portfolio'),
    ),
  );

  const output = await useCase.execute(
    { organizationId: ORGANIZATION_ID, role: 'MEMBER' },
    { programId: PROGRAM_ID },
  );

  assert.equal(output.projects.length, 1);
  assert.equal(output.projects[0]?.id, projectId('project-active'));
});

function project(
  organization: OrganizationId,
  program: ProgramId,
  id: string,
  name: string,
  code?: string,
  options: Readonly<{ deletedAt?: Date }> = {},
): Project {
  return {
    id: projectId(id),
    organizationId: organization,
    programId: program,
    name,
    ...(code === undefined ? {} : { code }),
    status: 'PLANNED',
    priority: 'MEDIUM',
    percentComplete: 0,
    ...(options.deletedAt === undefined ? {} : { deletedAt: options.deletedAt }),
    createdAt: NOW,
    updatedAt: NOW,
  };
}

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
