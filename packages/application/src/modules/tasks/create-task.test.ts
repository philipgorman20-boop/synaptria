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
  milestoneId,
  organizationId,
  projectId,
  requestId,
  taskId,
  userId,
  type IdGenerator,
  type MilestoneId,
  type OrganizationId,
} from '@synaptria/core';
import { AuthorizationDeniedError } from '@synaptria/core/errors';
import type {
  CreateMilestoneInput,
  Milestone,
  MilestoneRepository,
  UpdateMilestoneInput,
} from '@synaptria/domain/milestones';
import type {
  CreateTaskInput as RepositoryCreateTaskInput,
  Task,
  TaskRepository,
  UpdateTaskInput,
} from '@synaptria/domain/tasks';
import type {
  AggregateEventQuery,
  DomainEventEnvelope,
  DomainEventId,
  DomainEventStatus,
  EventRepository,
} from '@synaptria/events';

import { ApplicationError } from '../../shared/application-error';
import { CreateTaskUseCase } from './create-task';
import type {
  TaskTransactionRepositories,
  TaskUnitOfWork,
} from './task-unit-of-work';

const NOW = new Date('2026-07-26T16:00:00.000Z');
const USER_ID = userId('user-1');
const ORGANIZATION_ID = organizationId('org-1');
const OTHER_ORGANIZATION_ID = organizationId('org-2');
const MEMBERSHIP_ID = membershipId('membership-1');
const MILESTONE_ID = milestoneId('milestone-1');
const TASK_ID = taskId('task-1');

class FixedIdGenerator implements IdGenerator {
  generate(): string {
    return 'event-1';
  }
}

class InMemoryTaskRepository implements TaskRepository {
  createdInput?: RepositoryCreateTaskInput;

  async create(input: RepositoryCreateTaskInput): Promise<Task> {
    this.createdInput = input;
    return taskFixture(input);
  }

  async findById(): Promise<Task | null> {
    return null;
  }

  async update(): Promise<Task> {
    throw new Error('Not implemented in this test.');
  }

  async listForOrganization(): Promise<readonly Task[]> {
    return [];
  }

  async listForMilestone(): Promise<readonly Task[]> {
    return [];
  }
}

class InMemoryMilestoneRepository implements MilestoneRepository {
  constructor(readonly milestone: Milestone | null = null) {}

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

class InMemoryUnitOfWork implements TaskUnitOfWork {
  executions = 0;

  constructor(readonly repositories: TaskTransactionRepositories) {}

  async execute<T>(
    operation: (repositories: TaskTransactionRepositories) => Promise<T>,
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

test('creates task, audit record, and domain event using context organizationId', async () => {
  const tasks = new InMemoryTaskRepository();
  const audit = new InMemoryAuditRepository();
  const events = new InMemoryEventRepository();
  const unitOfWork = new InMemoryUnitOfWork({
    tasks,
    milestones: new InMemoryMilestoneRepository(
      milestoneFixture(ORGANIZATION_ID, MILESTONE_ID),
    ),
    audit,
    events,
  });
  const useCase = new CreateTaskUseCase(
    unitOfWork,
    new FixedClock(NOW),
    new FixedIdGenerator(),
  );

  const output = await useCase.execute(manageContext, {
    milestoneId: MILESTONE_ID,
    name: '  Prepare assay protocol  ',
    status: 'IN_PROGRESS',
    priority: 'HIGH',
  });

  assert.equal(unitOfWork.executions, 1);
  assert.equal(output.task.id, TASK_ID);
  assert.deepEqual(tasks.createdInput, {
    organizationId: ORGANIZATION_ID,
    milestoneId: MILESTONE_ID,
    name: 'Prepare assay protocol',
    status: 'IN_PROGRESS',
    priority: 'HIGH',
  });
  assert.equal(audit.input?.action, 'CREATE');
  assert.equal(audit.input?.target.entityType, 'Task');
  assert.equal(events.event?.eventType, 'task.created');
});

test('assigns default status and priority when omitted', async () => {
  const tasks = new InMemoryTaskRepository();
  const unitOfWork = new InMemoryUnitOfWork({
    tasks,
    milestones: new InMemoryMilestoneRepository(
      milestoneFixture(ORGANIZATION_ID, MILESTONE_ID),
    ),
    audit: new InMemoryAuditRepository(),
    events: new InMemoryEventRepository(),
  });
  const useCase = new CreateTaskUseCase(unitOfWork, new FixedClock(NOW));

  await useCase.execute(manageContext, {
    milestoneId: MILESTONE_ID,
    name: 'Draft protocol',
  });

  assert.equal(tasks.createdInput?.status, 'TODO');
  assert.equal(tasks.createdInput?.priority, 'MEDIUM');
});

test('rejects create when the parent milestone is missing', async () => {
  const tasks = new InMemoryTaskRepository();
  const unitOfWork = new InMemoryUnitOfWork({
    tasks,
    milestones: new InMemoryMilestoneRepository(null),
    audit: new InMemoryAuditRepository(),
    events: new InMemoryEventRepository(),
  });
  const useCase = new CreateTaskUseCase(unitOfWork);

  await assert.rejects(
    useCase.execute(manageContext, {
      milestoneId: MILESTONE_ID,
      name: 'Prepare assay protocol',
    }),
    (error: unknown) =>
      error instanceof ApplicationError &&
      error.code === 'NOT_FOUND' &&
      error.details?.field === 'milestoneId',
  );

  assert.equal(tasks.createdInput, undefined);
});

test('rejects create when the parent milestone belongs to another organization', async () => {
  const tasks = new InMemoryTaskRepository();
  const unitOfWork = new InMemoryUnitOfWork({
    tasks,
    milestones: new InMemoryMilestoneRepository(
      milestoneFixture(OTHER_ORGANIZATION_ID, MILESTONE_ID),
    ),
    audit: new InMemoryAuditRepository(),
    events: new InMemoryEventRepository(),
  });
  const useCase = new CreateTaskUseCase(unitOfWork);

  await assert.rejects(
    useCase.execute(manageContext, {
      milestoneId: MILESTONE_ID,
      name: 'Prepare assay protocol',
    }),
    (error: unknown) =>
      error instanceof ApplicationError && error.code === 'NOT_FOUND',
  );

  assert.equal(tasks.createdInput, undefined);
});

test('rejects invalid task input before opening a transaction', async () => {
  const unitOfWork = new InMemoryUnitOfWork({
    tasks: new InMemoryTaskRepository(),
    milestones: new InMemoryMilestoneRepository(
      milestoneFixture(ORGANIZATION_ID, MILESTONE_ID),
    ),
    audit: new InMemoryAuditRepository(),
    events: new InMemoryEventRepository(),
  });
  const useCase = new CreateTaskUseCase(unitOfWork);

  await assert.rejects(
    useCase.execute(manageContext, {
      milestoneId: MILESTONE_ID,
      name: '   ',
    }),
    (error: unknown) =>
      error instanceof ApplicationError &&
      error.code === 'VALIDATION_FAILED' &&
      error.details?.field === 'name',
  );

  assert.equal(unitOfWork.executions, 0);
});

test('rejects invalid Date objects before opening a transaction', async () => {
  const unitOfWork = new InMemoryUnitOfWork({
    tasks: new InMemoryTaskRepository(),
    milestones: new InMemoryMilestoneRepository(
      milestoneFixture(ORGANIZATION_ID, MILESTONE_ID),
    ),
    audit: new InMemoryAuditRepository(),
    events: new InMemoryEventRepository(),
  });
  const useCase = new CreateTaskUseCase(unitOfWork);

  await assert.rejects(
    useCase.execute(manageContext, {
      milestoneId: MILESTONE_ID,
      name: 'Prepare assay protocol',
      plannedStartDate: new Date('invalid'),
    }),
    (error: unknown) =>
      error instanceof ApplicationError &&
      error.code === 'VALIDATION_FAILED' &&
      error.details?.field === 'plannedStartDate',
  );

  assert.equal(unitOfWork.executions, 0);
});

test('rejects planned date ranges when start is after end', async () => {
  const unitOfWork = new InMemoryUnitOfWork({
    tasks: new InMemoryTaskRepository(),
    milestones: new InMemoryMilestoneRepository(
      milestoneFixture(ORGANIZATION_ID, MILESTONE_ID),
    ),
    audit: new InMemoryAuditRepository(),
    events: new InMemoryEventRepository(),
  });
  const useCase = new CreateTaskUseCase(unitOfWork);

  await assert.rejects(
    useCase.execute(manageContext, {
      milestoneId: MILESTONE_ID,
      name: 'Prepare assay protocol',
      plannedStartDate: new Date('2026-09-01T12:00:00.000Z'),
      plannedEndDate: new Date('2026-08-01T12:00:00.000Z'),
    }),
    (error: unknown) =>
      error instanceof ApplicationError &&
      error.code === 'VALIDATION_FAILED' &&
      error.details?.field === 'plannedStartDate',
  );

  assert.equal(unitOfWork.executions, 0);
});

test('rejects create attempts without tasks.manage permission', async () => {
  const useCase = new CreateTaskUseCase(
    new InMemoryUnitOfWork({
      tasks: new InMemoryTaskRepository(),
      milestones: new InMemoryMilestoneRepository(
        milestoneFixture(ORGANIZATION_ID, MILESTONE_ID),
      ),
      audit: new InMemoryAuditRepository(),
      events: new InMemoryEventRepository(),
    }),
  );

  await assert.rejects(
    useCase.execute(
      { ...manageContext, role: 'VIEWER' },
      { milestoneId: MILESTONE_ID, name: 'Prepare assay protocol' },
    ),
    AuthorizationDeniedError,
  );
});

test('uses organizationId from context rather than client-controlled input', async () => {
  const tasks = new InMemoryTaskRepository();
  const unitOfWork = new InMemoryUnitOfWork({
    tasks,
    milestones: new InMemoryMilestoneRepository(
      milestoneFixture(ORGANIZATION_ID, MILESTONE_ID),
    ),
    audit: new InMemoryAuditRepository(),
    events: new InMemoryEventRepository(),
  });
  const useCase = new CreateTaskUseCase(unitOfWork, new FixedClock(NOW));

  await useCase.execute(
    { ...manageContext, organizationId: ORGANIZATION_ID },
    { milestoneId: MILESTONE_ID, name: 'Scoped Task' },
  );

  assert.equal(tasks.createdInput?.organizationId, ORGANIZATION_ID);
  assert.notEqual(tasks.createdInput?.organizationId, OTHER_ORGANIZATION_ID);
});

function taskFixture(input: RepositoryCreateTaskInput): Task {
  return {
    id: TASK_ID,
    organizationId: input.organizationId,
    milestoneId: input.milestoneId,
    name: input.name,
    ...(input.description === undefined ? {} : { description: input.description }),
    status: input.status ?? 'TODO',
    priority: input.priority ?? 'MEDIUM',
    ...(input.plannedStartDate === undefined
      ? {}
      : { plannedStartDate: input.plannedStartDate }),
    ...(input.plannedEndDate === undefined
      ? {}
      : { plannedEndDate: input.plannedEndDate }),
    ...(input.actualStartDate === undefined
      ? {}
      : { actualStartDate: input.actualStartDate }),
    ...(input.actualEndDate === undefined ? {} : { actualEndDate: input.actualEndDate }),
    createdAt: NOW,
    updatedAt: NOW,
  };
}

function milestoneFixture(
  organization: OrganizationId,
  id: MilestoneId,
): Milestone {
  return {
    id,
    organizationId: organization,
    projectId: projectId('project-1'),
    name: 'Phase 1 Gate',
    status: 'PLANNED',
    priority: 'MEDIUM',
    createdAt: NOW,
    updatedAt: NOW,
  };
}
