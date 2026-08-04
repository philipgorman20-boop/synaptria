import assert from 'node:assert/strict';
import test from 'node:test';

import {
  correlationId,
  membershipId,
  milestoneId,
  organizationId,
  projectId,
  requestId,
  userId,
} from '@synaptria/core';

import type {
  CreateMilestoneContext,
  CreateMilestoneInput,
  CreateMilestoneOutput,
} from './create-milestone';
import type {
  GetMilestoneContext,
  GetMilestoneInput,
  GetMilestoneOutput,
} from './get-milestone';
import type {
  ListMilestonesContext,
  ListMilestonesOutput,
} from './list-milestones';
import type {
  ListProjectMilestonesContext,
  ListProjectMilestonesInput,
  ListProjectMilestonesOutput,
} from './list-project-milestones';
import { MilestoneService } from './milestone-service';

const USER_ID = userId('user-1');
const ORGANIZATION_ID = organizationId('org-1');
const PROJECT_ID = projectId('project-1');
const MILESTONE_ID = milestoneId('milestone-1');
const NOW = new Date('2026-07-22T18:00:00.000Z');

class CreateMilestoneStub {
  received?: Readonly<{
    context: CreateMilestoneContext;
    input: CreateMilestoneInput;
  }>;

  constructor(private readonly output: CreateMilestoneOutput) {}

  async execute(
    context: CreateMilestoneContext,
    input: CreateMilestoneInput,
  ): Promise<CreateMilestoneOutput> {
    this.received = { context, input };
    return this.output;
  }
}

class ListMilestonesStub {
  received?: ListMilestonesContext;

  constructor(private readonly output: ListMilestonesOutput) {}

  async execute(context: ListMilestonesContext): Promise<ListMilestonesOutput> {
    this.received = context;
    return this.output;
  }
}

class ListProjectMilestonesStub {
  received?: Readonly<{
    context: ListProjectMilestonesContext;
    input: ListProjectMilestonesInput;
  }>;

  constructor(private readonly output: ListProjectMilestonesOutput) {}

  async execute(
    context: ListProjectMilestonesContext,
    input: ListProjectMilestonesInput,
  ): Promise<ListProjectMilestonesOutput> {
    this.received = { context, input };
    return this.output;
  }
}

class GetMilestoneStub {
  received?: Readonly<{
    context: GetMilestoneContext;
    input: GetMilestoneInput;
  }>;

  constructor(private readonly output: GetMilestoneOutput) {}

  async execute(
    context: GetMilestoneContext,
    input: GetMilestoneInput,
  ): Promise<GetMilestoneOutput> {
    this.received = { context, input };
    return this.output;
  }
}

test('milestone service delegates to create, list, listProjectMilestones, and get use cases', async () => {
  const createOutput: CreateMilestoneOutput = {
    milestone: {
      id: MILESTONE_ID,
      organizationId: ORGANIZATION_ID,
      projectId: PROJECT_ID,
      name: 'IND Submission',
      status: 'PLANNED',
      priority: 'MEDIUM',
      createdAt: NOW,
      updatedAt: NOW,
    },
  };
  const listOutput: ListMilestonesOutput = { milestones: [createOutput.milestone] };
  const listProjectOutput: ListProjectMilestonesOutput = {
    milestones: [createOutput.milestone],
  };
  const getOutput: GetMilestoneOutput = createOutput;

  const create = new CreateMilestoneStub(createOutput);
  const list = new ListMilestonesStub(listOutput);
  const listProject = new ListProjectMilestonesStub(listProjectOutput);
  const get = new GetMilestoneStub(getOutput);
  const service = new MilestoneService(
    create as unknown as import('./create-milestone').CreateMilestoneUseCase,
    list as unknown as import('./list-milestones').ListMilestonesUseCase,
    listProject as unknown as import('./list-project-milestones').ListProjectMilestonesUseCase,
    get as unknown as import('./get-milestone').GetMilestoneUseCase,
  );

  const createContext = {
    organizationId: ORGANIZATION_ID,
    userId: USER_ID,
    membershipId: membershipId('membership-1'),
    role: 'MEMBER' as const,
    requestId: requestId('request-1'),
    correlationId: correlationId('correlation-1'),
  };
  const createInput = {
    projectId: PROJECT_ID,
    name: 'IND Submission',
  };
  const listContext = {
    organizationId: ORGANIZATION_ID,
    role: 'MEMBER' as const,
  };
  const listProjectContext = {
    organizationId: ORGANIZATION_ID,
    role: 'VIEWER' as const,
  };
  const listProjectInput = { projectId: PROJECT_ID };
  const getContext = {
    organizationId: ORGANIZATION_ID,
    role: 'VIEWER' as const,
  };
  const getInput = { milestoneId: MILESTONE_ID };

  assert.equal(await service.createMilestone(createContext, createInput), createOutput);
  assert.equal(await service.listMilestones(listContext), listOutput);
  assert.equal(
    await service.listProjectMilestones(listProjectContext, listProjectInput),
    listProjectOutput,
  );
  assert.equal(await service.getMilestone(getContext, getInput), getOutput);
  assert.deepEqual(create.received, { context: createContext, input: createInput });
  assert.deepEqual(list.received, listContext);
  assert.deepEqual(listProject.received, {
    context: listProjectContext,
    input: listProjectInput,
  });
  assert.deepEqual(get.received, { context: getContext, input: getInput });
});
