import assert from 'node:assert/strict';
import test from 'node:test';

import {
  correlationId,
  membershipId,
  organizationId,
  programId,
  requestId,
  userId,
} from '@synaptria/core';

import type {
  CreateProgramContext,
  CreateProgramInput,
  CreateProgramOutput,
} from './create-program';
import type {
  GetProgramContext,
  GetProgramInput,
  GetProgramOutput,
} from './get-program';
import type { ListProgramsContext, ListProgramsOutput } from './list-programs';
import { ProgramService } from './program-service';

const USER_ID = userId('user-1');
const ORGANIZATION_ID = organizationId('org-1');
const PROGRAM_ID = programId('program-1');
const NOW = new Date('2026-07-22T18:00:00.000Z');

class CreateProgramStub {
  received?: Readonly<{
    context: CreateProgramContext;
    input: CreateProgramInput;
  }>;

  constructor(private readonly output: CreateProgramOutput) {}

  async execute(
    context: CreateProgramContext,
    input: CreateProgramInput,
  ): Promise<CreateProgramOutput> {
    this.received = { context, input };
    return this.output;
  }
}

class ListProgramsStub {
  received?: ListProgramsContext;

  constructor(private readonly output: ListProgramsOutput) {}

  async execute(context: ListProgramsContext): Promise<ListProgramsOutput> {
    this.received = context;
    return this.output;
  }
}

class GetProgramStub {
  received?: Readonly<{
    context: GetProgramContext;
    input: GetProgramInput;
  }>;

  constructor(private readonly output: GetProgramOutput) {}

  async execute(
    context: GetProgramContext,
    input: GetProgramInput,
  ): Promise<GetProgramOutput> {
    this.received = { context, input };
    return this.output;
  }
}

test('program service delegates to create, list, and get use cases', async () => {
  const createOutput: CreateProgramOutput = {
    program: {
      id: PROGRAM_ID,
      organizationId: ORGANIZATION_ID,
      name: 'Oncology Portfolio',
      status: 'CONCEPT',
      priority: 'MEDIUM',
      createdAt: NOW,
      updatedAt: NOW,
    },
  };
  const listOutput: ListProgramsOutput = { programs: [createOutput.program] };
  const getOutput: GetProgramOutput = createOutput;

  const create = new CreateProgramStub(createOutput);
  const list = new ListProgramsStub(listOutput);
  const get = new GetProgramStub(getOutput);
  const service = new ProgramService(
    create as unknown as import('./create-program').CreateProgramUseCase,
    list as unknown as import('./list-programs').ListProgramsUseCase,
    get as unknown as import('./get-program').GetProgramUseCase,
  );

  const createContext = {
    organizationId: ORGANIZATION_ID,
    userId: USER_ID,
    membershipId: membershipId('membership-1'),
    role: 'MEMBER' as const,
    requestId: requestId('request-1'),
    correlationId: correlationId('correlation-1'),
  };
  const createInput = { name: 'Oncology Portfolio' };
  const listContext = {
    organizationId: ORGANIZATION_ID,
    role: 'MEMBER' as const,
  };
  const getContext = {
    organizationId: ORGANIZATION_ID,
    role: 'VIEWER' as const,
  };
  const getInput = { programId: PROGRAM_ID };

  assert.equal(await service.createProgram(createContext, createInput), createOutput);
  assert.equal(await service.listPrograms(listContext), listOutput);
  assert.equal(await service.getProgram(getContext, getInput), getOutput);
  assert.deepEqual(create.received, { context: createContext, input: createInput });
  assert.deepEqual(list.received, listContext);
  assert.deepEqual(get.received, { context: getContext, input: getInput });
});
