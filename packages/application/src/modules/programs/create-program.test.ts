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
  requestId,
  userId,
  type IdGenerator,
  type OrganizationId,
  type ProgramId,
} from '@synaptria/core';
import { AuthorizationDeniedError } from '@synaptria/core/errors';
import type {
  CreateProgramInput as RepositoryCreateProgramInput,
  Program,
  ProgramRepository,
  UpdateProgramInput,
} from '@synaptria/domain/programs';
import type {
  AggregateEventQuery,
  DomainEventEnvelope,
  DomainEventId,
  DomainEventStatus,
  EventRepository,
} from '@synaptria/events';

import { ApplicationError } from '../../shared/application-error';
import { CreateProgramUseCase } from './create-program';
import type {
  ProgramTransactionRepositories,
  ProgramUnitOfWork,
} from './program-unit-of-work';

const NOW = new Date('2026-07-22T16:00:00.000Z');
const USER_ID = userId('user-1');
const ORGANIZATION_ID = organizationId('org-1');
const OTHER_ORGANIZATION_ID = organizationId('org-2');
const MEMBERSHIP_ID = membershipId('membership-1');
const PROGRAM_ID = programId('program-1');

class FixedIdGenerator implements IdGenerator {
  generate(): string {
    return 'event-1';
  }
}

class InMemoryProgramRepository implements ProgramRepository {
  createdInput?: RepositoryCreateProgramInput;
  existingByName: Program | null = null;
  existingByCode: Program | null = null;

  async create(input: RepositoryCreateProgramInput): Promise<Program> {
    this.createdInput = input;
    return programFixture(input);
  }

  async findByName(
    _organizationId: OrganizationId,
    _name: string,
  ): Promise<Program | null> {
    return this.existingByName;
  }

  async findByCode(
    _organizationId: OrganizationId,
    _code: string,
  ): Promise<Program | null> {
    return this.existingByCode;
  }

  async findById(): Promise<Program | null> {
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

  async create(input: RecordAuditEventInput): Promise<AuditEventRecord> {
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

class InMemoryUnitOfWork implements ProgramUnitOfWork {
  executions = 0;

  constructor(readonly repositories: ProgramTransactionRepositories) {}

  async execute<T>(
    operation: (repositories: ProgramTransactionRepositories) => Promise<T>,
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

test('creates program, audit record, and domain event using context organizationId', async () => {
  const programs = new InMemoryProgramRepository();
  const audit = new InMemoryAuditRepository();
  const events = new InMemoryEventRepository();
  const unitOfWork = new InMemoryUnitOfWork({ programs, audit, events });
  const useCase = new CreateProgramUseCase(
    unitOfWork,
    new FixedClock(NOW),
    new FixedIdGenerator(),
  );

  const output = await useCase.execute(manageContext, {
    name: '  Oncology Portfolio  ',
    code: '  onco-001  ',
    status: 'DISCOVERY',
    priority: 'HIGH',
  });

  assert.equal(unitOfWork.executions, 1);
  assert.equal(output.program.id, PROGRAM_ID);
  assert.deepEqual(programs.createdInput, {
    organizationId: ORGANIZATION_ID,
    ownerId: USER_ID,
    name: 'Oncology Portfolio',
    code: 'ONCO-001',
    status: 'DISCOVERY',
    priority: 'HIGH',
  });
  assert.equal(audit.input?.action, 'CREATE');
  assert.equal(audit.input?.target.entityType, 'Program');
  assert.equal(audit.input?.organizationId, ORGANIZATION_ID);
  assert.equal(events.event?.eventType, 'program.created');
  assert.equal(events.event?.aggregateId, PROGRAM_ID);
  assert.equal(events.event?.organizationId, ORGANIZATION_ID);
});

test('rejects duplicate program name before writing anything', async () => {
  const programs = new InMemoryProgramRepository();
  programs.existingByName = programFixture({
    organizationId: ORGANIZATION_ID,
    name: 'Existing Program',
  });
  const unitOfWork = new InMemoryUnitOfWork({
    programs,
    audit: new InMemoryAuditRepository(),
    events: new InMemoryEventRepository(),
  });
  const useCase = new CreateProgramUseCase(
    unitOfWork,
    new FixedClock(NOW),
    new FixedIdGenerator(),
  );

  await assert.rejects(
    useCase.execute(manageContext, { name: 'Existing Program' }),
    (error: unknown) =>
      error instanceof ApplicationError && error.code === 'CONFLICT',
  );

  assert.equal(programs.createdInput, undefined);
});

test('rejects duplicate program code before writing anything', async () => {
  const programs = new InMemoryProgramRepository();
  programs.existingByCode = programFixture({
    organizationId: ORGANIZATION_ID,
    name: 'Other Program',
    code: 'ONCO-001',
  });
  const unitOfWork = new InMemoryUnitOfWork({
    programs,
    audit: new InMemoryAuditRepository(),
    events: new InMemoryEventRepository(),
  });
  const useCase = new CreateProgramUseCase(
    unitOfWork,
    new FixedClock(NOW),
    new FixedIdGenerator(),
  );

  await assert.rejects(
    useCase.execute(manageContext, { name: 'New Program', code: 'onco-001' }),
    (error: unknown) =>
      error instanceof ApplicationError &&
      error.code === 'CONFLICT' &&
      error.details?.field === 'code',
  );

  assert.equal(programs.createdInput, undefined);
});

test('rejects invalid program input before opening a transaction', async () => {
  const unitOfWork = new InMemoryUnitOfWork({
    programs: new InMemoryProgramRepository(),
    audit: new InMemoryAuditRepository(),
    events: new InMemoryEventRepository(),
  });
  const useCase = new CreateProgramUseCase(unitOfWork);

  await assert.rejects(
    useCase.execute(manageContext, { name: 'Program', code: 'bad code!' }),
    (error: unknown) =>
      error instanceof ApplicationError &&
      error.code === 'VALIDATION_FAILED',
  );

  assert.equal(unitOfWork.executions, 0);
});

test('rejects unsupported status values before opening a transaction', async () => {
  const unitOfWork = new InMemoryUnitOfWork({
    programs: new InMemoryProgramRepository(),
    audit: new InMemoryAuditRepository(),
    events: new InMemoryEventRepository(),
  });
  const useCase = new CreateProgramUseCase(unitOfWork);

  await assert.rejects(
    useCase.execute(manageContext, {
      name: 'Program',
      status: 'INVALID' as 'CONCEPT',
    }),
    (error: unknown) =>
      error instanceof ApplicationError &&
      error.code === 'VALIDATION_FAILED' &&
      error.details?.field === 'status',
  );

  assert.equal(unitOfWork.executions, 0);
});

test('rejects create attempts without programs.manage permission', async () => {
  const useCase = new CreateProgramUseCase(
    new InMemoryUnitOfWork({
      programs: new InMemoryProgramRepository(),
      audit: new InMemoryAuditRepository(),
      events: new InMemoryEventRepository(),
    }),
  );

  await assert.rejects(
    useCase.execute(
      { ...manageContext, role: 'VIEWER' },
      { name: 'Program' },
    ),
    AuthorizationDeniedError,
  );
});

test('uses organizationId from context rather than client-controlled input', async () => {
  const programs = new InMemoryProgramRepository();
  const unitOfWork = new InMemoryUnitOfWork({
    programs,
    audit: new InMemoryAuditRepository(),
    events: new InMemoryEventRepository(),
  });
  const useCase = new CreateProgramUseCase(
    unitOfWork,
    new FixedClock(NOW),
    new FixedIdGenerator(),
  );

  await useCase.execute(
    { ...manageContext, organizationId: ORGANIZATION_ID },
    { name: 'Scoped Program' },
  );

  assert.equal(programs.createdInput?.organizationId, ORGANIZATION_ID);
  assert.notEqual(programs.createdInput?.organizationId, OTHER_ORGANIZATION_ID);
});

function programFixture(
  input: RepositoryCreateProgramInput,
): Program {
  return {
    id: PROGRAM_ID,
    organizationId: input.organizationId,
    ...(input.ownerId === undefined ? {} : { ownerId: input.ownerId }),
    name: input.name,
    ...(input.code === undefined ? {} : { code: input.code }),
    ...(input.description === undefined ? {} : { description: input.description }),
    status: input.status ?? 'CONCEPT',
    priority: input.priority ?? 'MEDIUM',
    createdAt: NOW,
    updatedAt: NOW,
  };
}
