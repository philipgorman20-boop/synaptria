import assert from 'node:assert/strict';
import test from 'node:test';

import {
  milestoneId,
  organizationId,
  projectId,
  type MilestoneId,
  type OrganizationId,
} from '@synaptria/core';
import type {
  CreateMilestoneInput,
  Milestone,
  MilestoneRepository,
  UpdateMilestoneInput,
} from '@synaptria/domain/milestones';

import { ApplicationError } from '../../shared/application-error';
import { GetMilestoneUseCase } from './get-milestone';

const ORGANIZATION_ID = organizationId('org-1');
const OTHER_ORGANIZATION_ID = organizationId('org-2');
const MILESTONE_ID = milestoneId('milestone-1');
const NOW = new Date('2026-07-22T16:00:00.000Z');

class InMemoryMilestoneRepository implements MilestoneRepository {
  constructor(readonly milestone: Milestone | null) {}

  async findById(
    organizationId: OrganizationId,
    id: MilestoneId,
  ): Promise<Milestone | null> {
    if (this.milestone === null) {
      return null;
    }

    if (
      this.milestone.organizationId !== organizationId ||
      this.milestone.id !== id
    ) {
      return null;
    }

    return this.milestone;
  }

  async create(_input: CreateMilestoneInput): Promise<Milestone> {
    throw new Error('Not implemented in this test.');
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

  async listForProject(): Promise<readonly Milestone[]> {
    return [];
  }
}

test('returns a milestone within the active organization', async () => {
  const milestone = milestoneFixture(ORGANIZATION_ID, MILESTONE_ID, 'IND Submission');
  const useCase = new GetMilestoneUseCase(
    new InMemoryMilestoneRepository(milestone),
  );

  const output = await useCase.execute(
    { organizationId: ORGANIZATION_ID, role: 'VIEWER' },
    { milestoneId: MILESTONE_ID },
  );

  assert.equal(output.milestone.id, MILESTONE_ID);
});

test('returns not found when the milestone does not exist', async () => {
  const useCase = new GetMilestoneUseCase(new InMemoryMilestoneRepository(null));

  await assert.rejects(
    useCase.execute(
      { organizationId: ORGANIZATION_ID, role: 'MEMBER' },
      { milestoneId: MILESTONE_ID },
    ),
    (error: unknown) =>
      error instanceof ApplicationError && error.code === 'NOT_FOUND',
  );
});

test('returns not found when the milestone belongs to another organization', async () => {
  const milestone = milestoneFixture(
    OTHER_ORGANIZATION_ID,
    MILESTONE_ID,
    'Other Org Milestone',
  );
  const useCase = new GetMilestoneUseCase(
    new InMemoryMilestoneRepository(milestone),
  );

  await assert.rejects(
    useCase.execute(
      { organizationId: ORGANIZATION_ID, role: 'MEMBER' },
      { milestoneId: MILESTONE_ID },
    ),
    (error: unknown) =>
      error instanceof ApplicationError && error.code === 'NOT_FOUND',
  );
});

function milestoneFixture(
  organization: OrganizationId,
  id: MilestoneId,
  name: string,
): Milestone {
  return {
    id,
    organizationId: organization,
    projectId: projectId('project-1'),
    name,
    status: 'PLANNED',
    priority: 'MEDIUM',
    createdAt: NOW,
    updatedAt: NOW,
  };
}
