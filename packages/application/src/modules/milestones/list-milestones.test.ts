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

import { ListMilestonesUseCase } from './list-milestones';

const ORGANIZATION_ID = organizationId('org-1');
const OTHER_ORGANIZATION_ID = organizationId('org-2');
const NOW = new Date('2026-07-22T16:00:00.000Z');

class InMemoryMilestoneRepository implements MilestoneRepository {
  constructor(readonly milestones: readonly Milestone[]) {}

  async listForOrganization(
    organizationId: OrganizationId,
  ): Promise<readonly Milestone[]> {
    return this.milestones.filter(
      (milestone) => milestone.organizationId === organizationId,
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

  async listForProject(): Promise<readonly Milestone[]> {
    return [];
  }
}

test('lists milestones for the active organization alphabetically', async () => {
  const repository = new InMemoryMilestoneRepository([
    milestone(ORGANIZATION_ID, 'milestone-b', 'Beta Milestone'),
    milestone(ORGANIZATION_ID, 'milestone-a', 'Alpha Milestone'),
    milestone(OTHER_ORGANIZATION_ID, 'milestone-other', 'Other Org Milestone'),
  ]);
  const useCase = new ListMilestonesUseCase(repository);

  const output = await useCase.execute({
    organizationId: ORGANIZATION_ID,
    role: 'MEMBER',
  });

  assert.deepEqual(
    output.milestones.map((item) => item.id),
    [milestoneId('milestone-a'), milestoneId('milestone-b')],
  );
});

test('returns an empty result when the organization has no milestones', async () => {
  const useCase = new ListMilestonesUseCase(new InMemoryMilestoneRepository([]));

  const output = await useCase.execute({
    organizationId: ORGANIZATION_ID,
    role: 'VIEWER',
  });

  assert.deepEqual(output, { milestones: [] });
});

test('does not return milestones from another organization', async () => {
  const useCase = new ListMilestonesUseCase(
    new InMemoryMilestoneRepository([
      milestone(OTHER_ORGANIZATION_ID, 'milestone-other', 'Other Org Milestone'),
    ]),
  );

  const output = await useCase.execute({
    organizationId: ORGANIZATION_ID,
    role: 'MEMBER',
  });

  assert.deepEqual(output, { milestones: [] });
});

test('allows viewers to list milestones when they have milestones.read permission', async () => {
  const useCase = new ListMilestonesUseCase(
    new InMemoryMilestoneRepository([
      milestone(ORGANIZATION_ID, 'milestone-a', 'Alpha Milestone'),
    ]),
  );

  const output = await useCase.execute({
    organizationId: ORGANIZATION_ID,
    role: 'VIEWER',
  });

  assert.equal(output.milestones.length, 1);
});

function milestone(
  organization: OrganizationId,
  id: string,
  name: string,
  project: ProjectId = projectId('project-1'),
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
