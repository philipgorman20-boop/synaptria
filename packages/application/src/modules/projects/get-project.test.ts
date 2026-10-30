import assert from 'node:assert/strict';
import test from 'node:test';

import {
  organizationId,
  projectId,
  type OrganizationId,
  type ProjectId,
} from '@synaptria/core';
import type {
  CreateProjectInput,
  Project,
  ProjectRepository,
  UpdateProjectInput,
} from '@synaptria/domain/projects';

import { ApplicationError } from '../../shared/application-error';
import { GetProjectUseCase } from './get-project';

const ORGANIZATION_ID = organizationId('org-1');
const OTHER_ORGANIZATION_ID = organizationId('org-2');
const PROJECT_ID = projectId('project-1');
const NOW = new Date('2026-07-22T16:00:00.000Z');

class InMemoryProjectRepository implements ProjectRepository {
  constructor(readonly project: Project | null) {}

  async findById(
    organizationId: OrganizationId,
    id: ProjectId,
  ): Promise<Project | null> {
    if (this.project === null) {
      return null;
    }

    if (
      this.project.organizationId !== organizationId ||
      this.project.id !== id
    ) {
      return null;
    }

    return this.project;
  }

  async create(_input: CreateProjectInput): Promise<Project> {
    throw new Error('Not implemented in this test.');
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

  async listForProgram(): Promise<readonly Project[]> {
    return [];
  }
}

test('returns a project within the active organization', async () => {
  const project = projectFixture(ORGANIZATION_ID, PROJECT_ID, 'Alpha Project');
  const useCase = new GetProjectUseCase(
    new InMemoryProjectRepository(project),
  );

  const output = await useCase.execute(
    { organizationId: ORGANIZATION_ID, role: 'VIEWER' },
    { projectId: PROJECT_ID },
  );

  assert.equal(output.project.id, PROJECT_ID);
});

test('returns not found when the project does not exist', async () => {
  const useCase = new GetProjectUseCase(new InMemoryProjectRepository(null));

  await assert.rejects(
    useCase.execute(
      { organizationId: ORGANIZATION_ID, role: 'MEMBER' },
      { projectId: PROJECT_ID },
    ),
    (error: unknown) =>
      error instanceof ApplicationError && error.code === 'NOT_FOUND',
  );
});

test('returns not found when the project belongs to another organization', async () => {
  const project = projectFixture(OTHER_ORGANIZATION_ID, PROJECT_ID, 'Other Org');
  const useCase = new GetProjectUseCase(
    new InMemoryProjectRepository(project),
  );

  await assert.rejects(
    useCase.execute(
      { organizationId: ORGANIZATION_ID, role: 'MEMBER' },
      { projectId: PROJECT_ID },
    ),
    (error: unknown) =>
      error instanceof ApplicationError && error.code === 'NOT_FOUND',
  );
});

test('returns not found for soft-deleted projects', async () => {
  const project = projectFixture(ORGANIZATION_ID, PROJECT_ID, 'Deleted Project', {
    deletedAt: NOW,
  });
  const useCase = new GetProjectUseCase(
    new InMemoryProjectRepository(project),
  );

  await assert.rejects(
    useCase.execute(
      { organizationId: ORGANIZATION_ID, role: 'MEMBER' },
      { projectId: PROJECT_ID },
    ),
    (error: unknown) =>
      error instanceof ApplicationError && error.code === 'NOT_FOUND',
  );
});

function projectFixture(
  organization: OrganizationId,
  id: ProjectId,
  name: string,
  options: Readonly<{ deletedAt?: Date }> = {},
): Project {
  return {
    id,
    organizationId: organization,
    name,
    status: 'PLANNED',
    priority: 'MEDIUM',
    percentComplete: 0,
    ...(options.deletedAt === undefined ? {} : { deletedAt: options.deletedAt }),
    createdAt: NOW,
    updatedAt: NOW,
  };
}
