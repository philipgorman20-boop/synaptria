import assert from 'node:assert/strict';
import test from 'node:test';

import {
  correlationId,
  membershipId,
  organizationId,
  programId,
  projectId,
  requestId,
  userId,
} from '@synaptria/core';

import type {
  CreateProjectContext,
  CreateProjectInput,
  CreateProjectOutput,
} from './create-project';
import type {
  DeleteProjectContext,
  DeleteProjectInput,
  DeleteProjectOutput,
} from './delete-project';
import type {
  GetProjectContext,
  GetProjectInput,
  GetProjectOutput,
} from './get-project';
import type {
  ListProgramProjectsContext,
  ListProgramProjectsInput,
  ListProgramProjectsOutput,
} from './list-program-projects';
import type { ListProjectsContext, ListProjectsOutput } from './list-projects';
import { ProjectService } from './project-service';

const USER_ID = userId('user-1');
const ORGANIZATION_ID = organizationId('org-1');
const PROGRAM_ID = programId('program-1');
const PROJECT_ID = projectId('project-1');
const NOW = new Date('2026-07-22T18:00:00.000Z');

class CreateProjectStub {
  received?: Readonly<{
    context: CreateProjectContext;
    input: CreateProjectInput;
  }>;

  constructor(private readonly output: CreateProjectOutput) {}

  async execute(
    context: CreateProjectContext,
    input: CreateProjectInput,
  ): Promise<CreateProjectOutput> {
    this.received = { context, input };
    return this.output;
  }
}

class ListProjectsStub {
  received?: ListProjectsContext;

  constructor(private readonly output: ListProjectsOutput) {}

  async execute(context: ListProjectsContext): Promise<ListProjectsOutput> {
    this.received = context;
    return this.output;
  }
}

class ListProgramProjectsStub {
  received?: Readonly<{
    context: ListProgramProjectsContext;
    input: ListProgramProjectsInput;
  }>;

  constructor(private readonly output: ListProgramProjectsOutput) {}

  async execute(
    context: ListProgramProjectsContext,
    input: ListProgramProjectsInput,
  ): Promise<ListProgramProjectsOutput> {
    this.received = { context, input };
    return this.output;
  }
}

class DeleteProjectStub {
  async execute(
    _context: DeleteProjectContext,
    input: DeleteProjectInput,
  ): Promise<DeleteProjectOutput> {
    return { projectId: input.projectId };
  }
}

class UpdateProjectStub {
  async execute(): Promise<never> {
    throw new Error('not implemented');
  }
}

class GetProjectStub {
  received?: Readonly<{
    context: GetProjectContext;
    input: GetProjectInput;
  }>;

  constructor(private readonly output: GetProjectOutput) {}

  async execute(
    context: GetProjectContext,
    input: GetProjectInput,
  ): Promise<GetProjectOutput> {
    this.received = { context, input };
    return this.output;
  }
}

test('project service delegates to create, list, listProgramProjects, and get use cases', async () => {
  const createOutput: CreateProjectOutput = {
    project: {
      id: PROJECT_ID,
      organizationId: ORGANIZATION_ID,
      programId: PROGRAM_ID,
      name: 'Lead Candidate Study',
      status: 'PLANNED',
      priority: 'MEDIUM',
      percentComplete: 0,
      createdAt: NOW,
      updatedAt: NOW,
    },
  };
  const listOutput: ListProjectsOutput = { projects: [createOutput.project] };
  const listProgramOutput: ListProgramProjectsOutput = {
    projects: [createOutput.project],
  };
  const getOutput: GetProjectOutput = createOutput;

  const create = new CreateProjectStub(createOutput);
  const list = new ListProjectsStub(listOutput);
  const listProgram = new ListProgramProjectsStub(listProgramOutput);
  const get = new GetProjectStub(getOutput);
  const del = new DeleteProjectStub();
  const upd = new UpdateProjectStub();
  const service = new ProjectService(
    create as unknown as import('./create-project').CreateProjectUseCase,
    list as unknown as import('./list-projects').ListProjectsUseCase,
    listProgram as unknown as import('./list-program-projects').ListProgramProjectsUseCase,
    get as unknown as import('./get-project').GetProjectUseCase,
    del as unknown as import('./delete-project').DeleteProjectUseCase,
    upd as unknown as import('./update-project').UpdateProjectUseCase,
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
    name: 'Lead Candidate Study',
    programId: PROGRAM_ID,
  };
  const listContext = {
    organizationId: ORGANIZATION_ID,
    role: 'MEMBER' as const,
  };
  const listProgramContext = {
    organizationId: ORGANIZATION_ID,
    role: 'VIEWER' as const,
  };
  const listProgramInput = { programId: PROGRAM_ID };
  const getContext = {
    organizationId: ORGANIZATION_ID,
    role: 'VIEWER' as const,
  };
  const getInput = { projectId: PROJECT_ID };

  assert.equal(await service.createProject(createContext, createInput), createOutput);
  assert.equal(await service.listProjects(listContext), listOutput);
  assert.equal(
    await service.listProgramProjects(listProgramContext, listProgramInput),
    listProgramOutput,
  );
  assert.equal(await service.getProject(getContext, getInput), getOutput);
  assert.deepEqual(create.received, { context: createContext, input: createInput });
  assert.deepEqual(list.received, listContext);
  assert.deepEqual(listProgram.received, {
    context: listProgramContext,
    input: listProgramInput,
  });
  assert.deepEqual(get.received, { context: getContext, input: getInput });
});
