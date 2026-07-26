import assert from 'node:assert/strict';
import test from 'node:test';

import type {
  AuditEventRecord,
  AuditRepository,
  RecordAuditEventInput,
} from '@synaptria/audit';
import {
  FixedClock,
  correlationId,
  membershipId,
  organizationId,
  programId,
  projectId,
  requestId,
  userId,
  type IdGenerator,
  type OrganizationId,
  type ProgramId,
  type ProjectId,
} from '@synaptria/core';
import { AuthorizationDeniedError } from '@synaptria/core/errors';
import type {
  CreateProgramInput,
  Program,
  ProgramRepository,
  UpdateProgramInput,
} from '@synaptria/domain/programs';
import type {
  CreateProjectInput as RepositoryCreateProjectInput,
  Project,
  ProjectRepository,
  UpdateProjectInput,
} from '@synaptria/domain/projects';
import type {
  AggregateEventQuery,
  DomainEventEnvelope,
  DomainEventId,
  DomainEventStatus,
  EventRepository,
} from '@synaptria/events';

import { ApplicationError } from '../../shared/application-error';
import { CreateProjectUseCase } from './create-project';
import type {
  ProjectTransactionRepositories,
  ProjectUnitOfWork,
} from './project-unit-of-work';

const NOW = new Date('2026-07-22T16:00:00.000Z');
const USER_ID = userId('user-1');
const ORGANIZATION_ID = organizationId('org-1');
const OTHER_ORGANIZATION_ID = organizationId('org-2');
const MEMBERSHIP_ID = membershipId('membership-1');
const PROGRAM_ID = programId('program-1');
const PROJECT_ID = projectId('project-1');

class FixedIdGenerator implements IdGenerator {
  generate(): string {
    return 'event-1';
  }
}

class InMemoryProjectRepository implements ProjectRepository {
  createdInput?: RepositoryCreateProjectInput;
  existingByName: Project | null = null;
  existingByCode: Project | null = null;

  async create(input: RepositoryCreateProjectInput): Promise<Project> {
    this.createdInput = input;
    return projectFixture(input);
  }

  async findByName(
    _organizationId: OrganizationId,
    _name: string,
  ): Promise<Project | null> {
    return this.existingByName;
  }

  async findByCode(
    _organizationId: OrganizationId,
    _code: string,
  ): Promise<Project | null> {
    return this.existingByCode;
  }

  async findById(): Promise<Project | null> {
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

class InMemoryProgramRepository implements ProgramRepository {
  constructor(readonly program: Program | null = null) {}

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

class InMemoryAuditRepository implements AuditRepository {
  input?: RecordAuditEventInput;
  shouldFail = false;

  async create(input: RecordAuditEventInput): Promise<AuditEventRecord> {
    if (this.shouldFail) {
      throw new Error('Audit write failed.');
    }

    this.input = input;
    return { id: 'audit-1', ...input, occurredAt: input.occurredAt ?? NOW };
  }
}

class InMemoryEventRepository implements EventRepository {
  event?: DomainEventEnvelope;

  async append(event: DomainEventEnvelope): Promise<DomainEventEnvelope> {
    this.event = event;
    return event;
  }

  async appendMany(
    events: readonly DomainEventEnvelope[],
  ): Promise<readonly DomainEventEnvelope[]> {
    return events;
  }

  async findById(): Promise<DomainEventEnvelope | null> {
    return null;
  }

  async findByAggregate(
    _query: AggregateEventQuery,
  ): Promise<readonly DomainEventEnvelope[]> {
    return [];
  }

  async updateStatus(
    _id: DomainEventId,
    _status: DomainEventStatus,
  ): Promise<DomainEventEnvelope> {
    throw new Error('Not implemented in this test.');
  }
}

class InMemoryUnitOfWork implements ProjectUnitOfWork {
  executions = 0;

  constructor(readonly repositories: ProjectTransactionRepositories) {}

  async execute<T>(
    operation: (repositories: ProjectTransactionRepositories) => Promise<T>,
  ): Promise<T> {
    this.executions += 1;
    return operation(this.repositories);
  }
}

const manageContext = {
  organizationId: ORGANIZATION_ID,
  userId: USER_ID,
  membershipId: MEMBERSHIP_ID,
  role: 'MEMBER' as const,
  requestId: requestId('request-1'),
  correlationId: correlationId('correlation-1'),
};

test('creates project, audit record, and domain event using context organizationId', async () => {
  const projects = new InMemoryProjectRepository();
  const audit = new InMemoryAuditRepository();
  const events = new InMemoryEventRepository();
  const unitOfWork = new InMemoryUnitOfWork({
    projects,
    programs: new InMemoryProgramRepository(),
    audit,
    events,
  });
  const useCase = new CreateProjectUseCase(
    unitOfWork,
    new FixedClock(NOW),
    new FixedIdGenerator(),
  );

  const output = await useCase.execute(manageContext, {
    name: '  Lead Candidate Study  ',
    code: '  lc-001  ',
    status: 'ACTIVE',
    priority: 'HIGH',
    percentComplete: 25,
  });

  assert.equal(unitOfWork.executions, 1);
  assert.equal(output.project.id, PROJECT_ID);
  assert.deepEqual(projects.createdInput, {
    organizationId: ORGANIZATION_ID,
    ownerId: USER_ID,
    name: 'Lead Candidate Study',
    code: 'LC-001',
    status: 'ACTIVE',
    priority: 'HIGH',
    percentComplete: 25,
  });
  assert.equal(audit.input?.action, 'CREATE');
  assert.equal(audit.input?.target.entityType, 'Project');
  assert.equal(audit.input?.organizationId, ORGANIZATION_ID);
  assert.equal(events.event?.eventType, 'project.created');
  assert.equal(events.event?.aggregateId, PROJECT_ID);
  assert.equal(events.event?.organizationId, ORGANIZATION_ID);
});

test('creates a project without a program when programId is omitted', async () => {
  const projects = new InMemoryProjectRepository();
  const unitOfWork = new InMemoryUnitOfWork({
    projects,
    programs: new InMemoryProgramRepository(),
    audit: new InMemoryAuditRepository(),
    events: new InMemoryEventRepository(),
  });
  const useCase = new CreateProjectUseCase(
    unitOfWork,
    new FixedClock(NOW),
    new FixedIdGenerator(),
  );

  await useCase.execute(manageContext, { name: 'Standalone Project' });

  assert.equal(projects.createdInput?.programId, undefined);
});

test('creates a project linked to a valid program in the same organization', async () => {
  const projects = new InMemoryProjectRepository();
  const unitOfWork = new InMemoryUnitOfWork({
    projects,
    programs: new InMemoryProgramRepository(
      programFixture(ORGANIZATION_ID, PROGRAM_ID, 'Oncology Portfolio'),
    ),
    audit: new InMemoryAuditRepository(),
    events: new InMemoryEventRepository(),
  });
  const useCase = new CreateProjectUseCase(
    unitOfWork,
    new FixedClock(NOW),
    new FixedIdGenerator(),
  );

  await useCase.execute(manageContext, {
    name: 'Linked Project',
    programId: PROGRAM_ID,
  });

  assert.equal(projects.createdInput?.programId, PROGRAM_ID);
});

test('rejects create when the parent program is missing', async () => {
  const projects = new InMemoryProjectRepository();
  const unitOfWork = new InMemoryUnitOfWork({
    projects,
    programs: new InMemoryProgramRepository(null),
    audit: new InMemoryAuditRepository(),
    events: new InMemoryEventRepository(),
  });
  const useCase = new CreateProjectUseCase(unitOfWork);

  await assert.rejects(
    useCase.execute(manageContext, {
      name: 'Linked Project',
      programId: PROGRAM_ID,
    }),
    (error: unknown) =>
      error instanceof ApplicationError &&
      error.code === 'NOT_FOUND' &&
      error.details?.field === 'programId',
  );

  assert.equal(projects.createdInput, undefined);
});

test('rejects create when the parent program belongs to another organization', async () => {
  const projects = new InMemoryProjectRepository();
  const unitOfWork = new InMemoryUnitOfWork({
    projects,
    programs: new InMemoryProgramRepository(
      programFixture(OTHER_ORGANIZATION_ID, PROGRAM_ID, 'Other Org Program'),
    ),
    audit: new InMemoryAuditRepository(),
    events: new InMemoryEventRepository(),
  });
  const useCase = new CreateProjectUseCase(unitOfWork);

  await assert.rejects(
    useCase.execute(manageContext, {
      name: 'Linked Project',
      programId: PROGRAM_ID,
    }),
    (error: unknown) =>
      error instanceof ApplicationError && error.code === 'NOT_FOUND',
  );

  assert.equal(projects.createdInput, undefined);
});

test('rejects create when the parent program is soft-deleted', async () => {
  const projects = new InMemoryProjectRepository();
  const unitOfWork = new InMemoryUnitOfWork({
    projects,
    programs: new InMemoryProgramRepository(
      programFixture(ORGANIZATION_ID, PROGRAM_ID, 'Deleted Program', {
        deletedAt: NOW,
      }),
    ),
    audit: new InMemoryAuditRepository(),
    events: new InMemoryEventRepository(),
  });
  const useCase = new CreateProjectUseCase(unitOfWork);

  await assert.rejects(
    useCase.execute(manageContext, {
      name: 'Linked Project',
      programId: PROGRAM_ID,
    }),
    (error: unknown) =>
      error instanceof ApplicationError && error.code === 'NOT_FOUND',
  );

  assert.equal(projects.createdInput, undefined);
});

test('rejects duplicate project name before writing anything', async () => {
  const projects = new InMemoryProjectRepository();
  projects.existingByName = projectFixture({
    organizationId: ORGANIZATION_ID,
    name: 'Existing Project',
  });
  const unitOfWork = new InMemoryUnitOfWork({
    projects,
    programs: new InMemoryProgramRepository(),
    audit: new InMemoryAuditRepository(),
    events: new InMemoryEventRepository(),
  });
  const useCase = new CreateProjectUseCase(unitOfWork);

  await assert.rejects(
    useCase.execute(manageContext, { name: 'Existing Project' }),
    (error: unknown) =>
      error instanceof ApplicationError && error.code === 'CONFLICT',
  );

  assert.equal(projects.createdInput, undefined);
});

test('rejects duplicate project code before writing anything', async () => {
  const projects = new InMemoryProjectRepository();
  projects.existingByCode = projectFixture({
    organizationId: ORGANIZATION_ID,
    name: 'Other Project',
    code: 'LC-001',
  });
  const unitOfWork = new InMemoryUnitOfWork({
    projects,
    programs: new InMemoryProgramRepository(),
    audit: new InMemoryAuditRepository(),
    events: new InMemoryEventRepository(),
  });
  const useCase = new CreateProjectUseCase(unitOfWork);

  await assert.rejects(
    useCase.execute(manageContext, { name: 'New Project', code: 'lc-001' }),
    (error: unknown) =>
      error instanceof ApplicationError &&
      error.code === 'CONFLICT' &&
      error.details?.field === 'code',
  );

  assert.equal(projects.createdInput, undefined);
});

test('rejects invalid project input before opening a transaction', async () => {
  const unitOfWork = new InMemoryUnitOfWork({
    projects: new InMemoryProjectRepository(),
    programs: new InMemoryProgramRepository(),
    audit: new InMemoryAuditRepository(),
    events: new InMemoryEventRepository(),
  });
  const useCase = new CreateProjectUseCase(unitOfWork);

  await assert.rejects(
    useCase.execute(manageContext, { name: 'Project', code: 'bad code!' }),
    (error: unknown) =>
      error instanceof ApplicationError &&
      error.code === 'VALIDATION_FAILED',
  );

  assert.equal(unitOfWork.executions, 0);
});

test('rejects unsupported status values before opening a transaction', async () => {
  const unitOfWork = new InMemoryUnitOfWork({
    projects: new InMemoryProjectRepository(),
    programs: new InMemoryProgramRepository(),
    audit: new InMemoryAuditRepository(),
    events: new InMemoryEventRepository(),
  });
  const useCase = new CreateProjectUseCase(unitOfWork);

  await assert.rejects(
    useCase.execute(manageContext, {
      name: 'Project',
      status: 'INVALID' as 'PLANNED',
    }),
    (error: unknown) =>
      error instanceof ApplicationError &&
      error.code === 'VALIDATION_FAILED' &&
      error.details?.field === 'status',
  );

  assert.equal(unitOfWork.executions, 0);
});

test('rejects invalid percentComplete before opening a transaction', async () => {
  const unitOfWork = new InMemoryUnitOfWork({
    projects: new InMemoryProjectRepository(),
    programs: new InMemoryProgramRepository(),
    audit: new InMemoryAuditRepository(),
    events: new InMemoryEventRepository(),
  });
  const useCase = new CreateProjectUseCase(unitOfWork);

  await assert.rejects(
    useCase.execute(manageContext, {
      name: 'Project',
      percentComplete: 101,
    }),
    (error: unknown) =>
      error instanceof ApplicationError &&
      error.code === 'VALIDATION_FAILED' &&
      error.details?.field === 'percentComplete',
  );

  assert.equal(unitOfWork.executions, 0);
});

test('rejects create attempts without projects.manage permission', async () => {
  const useCase = new CreateProjectUseCase(
    new InMemoryUnitOfWork({
      projects: new InMemoryProjectRepository(),
      programs: new InMemoryProgramRepository(),
      audit: new InMemoryAuditRepository(),
      events: new InMemoryEventRepository(),
    }),
  );

  await assert.rejects(
    useCase.execute(
      { ...manageContext, role: 'VIEWER' },
      { name: 'Project' },
    ),
    AuthorizationDeniedError,
  );
});

test('uses organizationId and ownerId from context rather than client-controlled input', async () => {
  const projects = new InMemoryProjectRepository();
  const unitOfWork = new InMemoryUnitOfWork({
    projects,
    programs: new InMemoryProgramRepository(),
    audit: new InMemoryAuditRepository(),
    events: new InMemoryEventRepository(),
  });
  const useCase = new CreateProjectUseCase(
    unitOfWork,
    new FixedClock(NOW),
    new FixedIdGenerator(),
  );

  await useCase.execute(
    { ...manageContext, organizationId: ORGANIZATION_ID },
    { name: 'Scoped Project' },
  );

  assert.equal(projects.createdInput?.organizationId, ORGANIZATION_ID);
  assert.equal(projects.createdInput?.ownerId, USER_ID);
  assert.notEqual(projects.createdInput?.organizationId, OTHER_ORGANIZATION_ID);
});

test('propagates transaction failures after project creation', async () => {
  const projects = new InMemoryProjectRepository();
  const audit = new InMemoryAuditRepository();
  audit.shouldFail = true;
  const unitOfWork = new InMemoryUnitOfWork({
    projects,
    programs: new InMemoryProgramRepository(),
    audit,
    events: new InMemoryEventRepository(),
  });
  const useCase = new CreateProjectUseCase(
    unitOfWork,
    new FixedClock(NOW),
    new FixedIdGenerator(),
  );

  await assert.rejects(
    useCase.execute(manageContext, { name: 'Project' }),
    /Audit write failed/,
  );

  assert.equal(unitOfWork.executions, 1);
  assert.notEqual(projects.createdInput, undefined);
});

function projectFixture(
  input: RepositoryCreateProjectInput,
): Project {
  return {
    id: PROJECT_ID,
    organizationId: input.organizationId,
    ...(input.programId === undefined ? {} : { programId: input.programId }),
    ...(input.ownerId === undefined ? {} : { ownerId: input.ownerId }),
    name: input.name,
    ...(input.code === undefined ? {} : { code: input.code }),
    ...(input.description === undefined ? {} : { description: input.description }),
    status: input.status ?? 'PLANNED',
    priority: input.priority ?? 'MEDIUM',
    percentComplete: input.percentComplete ?? 0,
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
