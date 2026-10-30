import assert from 'node:assert/strict';
import test from 'node:test';

import {
  organizationId,
  projectId,
  type OrganizationId,
  type ProgramId,
  type ProjectId,
} from '@synaptria/core';
import type {
  CreateProjectInput,
  Project,
  ProjectRepository,
  UpdateProjectInput,
} from '@synaptria/domain/projects';

import { ListProjectsUseCase } from './list-projects';

const ORGANIZATION_ID = organizationId('org-1');
const OTHER_ORGANIZATION_ID = organizationId('org-2');
const NOW = new Date('2026-07-22T16:00:00.000Z');

class InMemoryProjectRepository implements ProjectRepository {
  constructor(readonly projects: readonly Project[]) {}

  async listForOrganization(
    organizationId: OrganizationId,
  ): Promise<readonly Project[]> {
    return this.projects.filter(
      (project) => project.organizationId === organizationId,
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

  async listForProgram(): Promise<readonly Project[]> {
    return [];
  }
}

test('lists projects for the active organization alphabetically', async () => {
  const repository = new InMemoryProjectRepository([
    project(ORGANIZATION_ID, 'project-b', 'Beta Project', 'BETA'),
    project(ORGANIZATION_ID, 'project-a', 'Alpha Project', 'ALPHA'),
    project(OTHER_ORGANIZATION_ID, 'project-other', 'Other Org Project'),
  ]);
  const useCase = new ListProjectsUseCase(repository);

  const output = await useCase.execute({
    organizationId: ORGANIZATION_ID,
    role: 'MEMBER',
  });

  assert.deepEqual(
    output.projects.map((item) => item.id),
    [projectId('project-a'), projectId('project-b')],
  );
});

test('returns an empty result when the organization has no projects', async () => {
  const useCase = new ListProjectsUseCase(new InMemoryProjectRepository([]));

  const output = await useCase.execute({
    organizationId: ORGANIZATION_ID,
    role: 'VIEWER',
  });

  assert.deepEqual(output, { projects: [] });
});

test('defensively excludes soft-deleted projects', async () => {
  const deleted = project(ORGANIZATION_ID, 'project-deleted', 'Deleted Project', undefined, {
    deletedAt: NOW,
  });
  const active = project(ORGANIZATION_ID, 'project-active', 'Active Project');
  const useCase = new ListProjectsUseCase(
    new InMemoryProjectRepository([deleted, active]),
  );

  const output = await useCase.execute({
    organizationId: ORGANIZATION_ID,
    role: 'MEMBER',
  });

  assert.equal(output.projects.length, 1);
  assert.equal(output.projects[0]?.id, projectId('project-active'));
});

test('does not return projects from another organization', async () => {
  const useCase = new ListProjectsUseCase(
    new InMemoryProjectRepository([
      project(OTHER_ORGANIZATION_ID, 'project-other', 'Other Org Project'),
    ]),
  );

  const output = await useCase.execute({
    organizationId: ORGANIZATION_ID,
    role: 'MEMBER',
  });

  assert.deepEqual(output, { projects: [] });
});

test('allows viewers to list projects when they have projects.read permission', async () => {
  const useCase = new ListProjectsUseCase(
    new InMemoryProjectRepository([
      project(ORGANIZATION_ID, 'project-a', 'Alpha Project'),
    ]),
  );

  const output = await useCase.execute({
    organizationId: ORGANIZATION_ID,
    role: 'VIEWER',
  });

  assert.equal(output.projects.length, 1);
});

function project(
  organization: OrganizationId,
  id: string,
  name: string,
  code?: string,
  options: Readonly<{ deletedAt?: Date; programId?: ProgramId }> = {},
): Project {
  return {
    id: projectId(id),
    organizationId: organization,
    name,
    ...(code === undefined ? {} : { code }),
    ...(options.programId === undefined ? {} : { programId: options.programId }),
    status: 'PLANNED',
    priority: 'MEDIUM',
    percentComplete: 0,
    ...(options.deletedAt === undefined ? {} : { deletedAt: options.deletedAt }),
    createdAt: NOW,
    updatedAt: NOW,
  };
}
