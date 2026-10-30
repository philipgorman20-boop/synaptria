import assert from 'node:assert/strict';
import test from 'node:test';

import {
  milestoneId,
  organizationId,
  projectId,
  type MilestoneId,
  type OrganizationId,
  type ProjectId,
} from '@synaptria/core';
import type {
  CreateMilestoneInput,
  Milestone,
  MilestoneRepository,
  UpdateMilestoneInput,
} from '@synaptria/domain/milestones';
import type {
  CreateProjectInput,
  Project,
  ProjectRepository,
  UpdateProjectInput,
} from '@synaptria/domain/projects';

import { ApplicationError } from '../../shared/application-error';
import { ListProjectMilestonesUseCase } from './list-project-milestones';

const ORGANIZATION_ID = organizationId('org-1');
const OTHER_ORGANIZATION_ID = organizationId('org-2');
const PROJECT_ID = projectId('project-1');
const OTHER_PROJECT_ID = projectId('project-other');
const NOW = new Date('2026-07-22T16:00:00.000Z');

class InMemoryMilestoneRepository implements MilestoneRepository {
  constructor(readonly milestones: readonly Milestone[]) {}

  async listForProject(
    organizationId: OrganizationId,
    projectId: ProjectId,
  ): Promise<readonly Milestone[]> {
    return this.milestones.filter(
      (milestone) =>
        milestone.organizationId === organizationId &&
        milestone.projectId === projectId,
    );
  }

  async create(_input: CreateMilestoneInput): Promise<Milestone> {
    throw new Error('Not implemented in this test.');
  }

  async findById(): Promise<Milestone | null> {
    return null;
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
}

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

test('lists milestones for a valid project alphabetically', async () => {
  const repository = new InMemoryMilestoneRepository([
    milestone(ORGANIZATION_ID, PROJECT_ID, 'milestone-b', 'Beta Milestone'),
    milestone(ORGANIZATION_ID, PROJECT_ID, 'milestone-a', 'Alpha Milestone'),
    milestone(ORGANIZATION_ID, OTHER_PROJECT_ID, 'milestone-other', 'Other Project Milestone'),
  ]);
  const useCase = new ListProjectMilestonesUseCase(
    repository,
    new InMemoryProjectRepository(projectFixture(ORGANIZATION_ID, PROJECT_ID)),
  );

  const output = await useCase.execute(
    { organizationId: ORGANIZATION_ID, role: 'MEMBER' },
    { projectId: PROJECT_ID },
  );

  assert.deepEqual(
    output.milestones.map((item) => item.id),
    [milestoneId('milestone-a'), milestoneId('milestone-b')],
  );
});

test('returns not found when the parent project does not exist', async () => {
  const useCase = new ListProjectMilestonesUseCase(
    new InMemoryMilestoneRepository([]),
    new InMemoryProjectRepository(null),
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

test('returns not found when the parent project belongs to another organization', async () => {
  const useCase = new ListProjectMilestonesUseCase(
    new InMemoryMilestoneRepository([]),
    new InMemoryProjectRepository(
      projectFixture(OTHER_ORGANIZATION_ID, PROJECT_ID),
    ),
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

test('returns not found when the parent project is soft-deleted', async () => {
  const useCase = new ListProjectMilestonesUseCase(
    new InMemoryMilestoneRepository([]),
    new InMemoryProjectRepository(
      projectFixture(ORGANIZATION_ID, PROJECT_ID, { deletedAt: NOW }),
    ),
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

function milestone(
  organization: OrganizationId,
  project: ProjectId,
  id: string,
  name: string,
): Milestone {
  return {
    id: milestoneId(id),
    organizationId: organization,
    projectId: project,
    name,
    status: 'PLANNED',
    priority: 'MEDIUM',
    createdAt: NOW,
    updatedAt: NOW,
  };
}

function projectFixture(
  organization: OrganizationId,
  id: ProjectId,
  options: Readonly<{ deletedAt?: Date }> = {},
): Project {
  return {
    id,
    organizationId: organization,
    name: 'Lead Candidate Study',
    status: 'PLANNED',
    priority: 'MEDIUM',
    percentComplete: 0,
    ...(options.deletedAt === undefined ? {} : { deletedAt: options.deletedAt }),
    createdAt: NOW,
    updatedAt: NOW,
  };
}
