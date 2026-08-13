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
  userId,
  type IdGenerator,
  type MilestoneId,
  type OrganizationId,
  type ProjectId,
} from '@synaptria/core';
import { AuthorizationDeniedError } from '@synaptria/core/errors';
import type {
  CreateMilestoneInput as RepositoryCreateMilestoneInput,
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
import type {
  AggregateEventQuery,
  DomainEventEnvelope,
  DomainEventId,
  DomainEventStatus,
  EventRepository,
  OrganizationRecentEventsQuery,
} from '@synaptria/events';

import { ApplicationError } from '../../shared/application-error';
import { CreateMilestoneUseCase } from './create-milestone';
import type {
  MilestoneTransactionRepositories,
  MilestoneUnitOfWork,
} from './milestone-unit-of-work';

const NOW = new Date('2026-07-22T16:00:00.000Z');
const USER_ID = userId('user-1');
const ORGANIZATION_ID = organizationId('org-1');
const OTHER_ORGANIZATION_ID = organizationId('org-2');
const MEMBERSHIP_ID = membershipId('membership-1');
const PROJECT_ID = projectId('project-1');
const MILESTONE_ID = milestoneId('milestone-1');

class FixedIdGenerator implements IdGenerator {
  generate(): string {
    return 'event-1';
  }
}

class InMemoryMilestoneRepository implements MilestoneRepository {
  createdInput?: RepositoryCreateMilestoneInput;

  async create(input: RepositoryCreateMilestoneInput): Promise<Milestone> {
    this.createdInput = input;
    return milestoneFixture(input);
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

  async listForProject(): Promise<readonly Milestone[]> {
    return [];
  }
}

class InMemoryProjectRepository implements ProjectRepository {
  constructor(readonly project: Project | null = null) {}

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

  async listRecentForOrganization(
    _query: OrganizationRecentEventsQuery,
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

class InMemoryUnitOfWork implements MilestoneUnitOfWork {
  executions = 0;

  constructor(readonly repositories: MilestoneTransactionRepositories) {}

  async execute<T>(
    operation: (repositories: MilestoneTransactionRepositories) => Promise<T>,
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

test('creates milestone, audit record, and domain event using context organizationId', async () => {
  const milestones = new InMemoryMilestoneRepository();
  const audit = new InMemoryAuditRepository();
  const events = new InMemoryEventRepository();
  const unitOfWork = new InMemoryUnitOfWork({
    milestones,
    projects: new InMemoryProjectRepository(projectFixture(ORGANIZATION_ID, PROJECT_ID)),
    audit,
    events,
  });
  const useCase = new CreateMilestoneUseCase(
    unitOfWork,
    new FixedClock(NOW),
    new FixedIdGenerator(),
  );

  const output = await useCase.execute(manageContext, {
    projectId: PROJECT_ID,
    name: '  IND Submission  ',
    status: 'IN_PROGRESS',
    priority: 'HIGH',
  });

  assert.equal(unitOfWork.executions, 1);
  assert.equal(output.milestone.id, MILESTONE_ID);
  assert.deepEqual(milestones.createdInput, {
    organizationId: ORGANIZATION_ID,
    projectId: PROJECT_ID,
    name: 'IND Submission',
    status: 'IN_PROGRESS',
    priority: 'HIGH',
  });
  assert.equal(audit.input?.action, 'CREATE');
  assert.equal(audit.input?.target.entityType, 'Milestone');
  assert.equal(events.event?.eventType, 'milestone.created');
});

test('assigns default status and priority when omitted', async () => {
  const milestones = new InMemoryMilestoneRepository();
  const unitOfWork = new InMemoryUnitOfWork({
    milestones,
    projects: new InMemoryProjectRepository(projectFixture(ORGANIZATION_ID, PROJECT_ID)),
    audit: new InMemoryAuditRepository(),
    events: new InMemoryEventRepository(),
  });
  const useCase = new CreateMilestoneUseCase(unitOfWork, new FixedClock(NOW));

  await useCase.execute(manageContext, {
    projectId: PROJECT_ID,
    name: 'Protocol Finalization',
  });

  assert.equal(milestones.createdInput?.status, 'PLANNED');
  assert.equal(milestones.createdInput?.priority, 'MEDIUM');
});

test('rejects create when the parent project is missing', async () => {
  const milestones = new InMemoryMilestoneRepository();
  const unitOfWork = new InMemoryUnitOfWork({
    milestones,
    projects: new InMemoryProjectRepository(null),
    audit: new InMemoryAuditRepository(),
    events: new InMemoryEventRepository(),
  });
  const useCase = new CreateMilestoneUseCase(unitOfWork);

  await assert.rejects(
    useCase.execute(manageContext, {
      projectId: PROJECT_ID,
      name: 'IND Submission',
    }),
    (error: unknown) =>
      error instanceof ApplicationError &&
      error.code === 'NOT_FOUND' &&
      error.details?.field === 'projectId',
  );

  assert.equal(milestones.createdInput, undefined);
});

test('rejects create when the parent project belongs to another organization', async () => {
  const milestones = new InMemoryMilestoneRepository();
  const unitOfWork = new InMemoryUnitOfWork({
    milestones,
    projects: new InMemoryProjectRepository(
      projectFixture(OTHER_ORGANIZATION_ID, PROJECT_ID),
    ),
    audit: new InMemoryAuditRepository(),
    events: new InMemoryEventRepository(),
  });
  const useCase = new CreateMilestoneUseCase(unitOfWork);

  await assert.rejects(
    useCase.execute(manageContext, {
      projectId: PROJECT_ID,
      name: 'IND Submission',
    }),
    (error: unknown) =>
      error instanceof ApplicationError && error.code === 'NOT_FOUND',
  );

  assert.equal(milestones.createdInput, undefined);
});

test('rejects create when the parent project is soft-deleted', async () => {
  const milestones = new InMemoryMilestoneRepository();
  const unitOfWork = new InMemoryUnitOfWork({
    milestones,
    projects: new InMemoryProjectRepository(
      projectFixture(ORGANIZATION_ID, PROJECT_ID, { deletedAt: NOW }),
    ),
    audit: new InMemoryAuditRepository(),
    events: new InMemoryEventRepository(),
  });
  const useCase = new CreateMilestoneUseCase(unitOfWork);

  await assert.rejects(
    useCase.execute(manageContext, {
      projectId: PROJECT_ID,
      name: 'IND Submission',
    }),
    (error: unknown) =>
      error instanceof ApplicationError && error.code === 'NOT_FOUND',
  );
});

test('rejects invalid milestone input before opening a transaction', async () => {
  const unitOfWork = new InMemoryUnitOfWork({
    milestones: new InMemoryMilestoneRepository(),
    projects: new InMemoryProjectRepository(projectFixture(ORGANIZATION_ID, PROJECT_ID)),
    audit: new InMemoryAuditRepository(),
    events: new InMemoryEventRepository(),
  });
  const useCase = new CreateMilestoneUseCase(unitOfWork);

  await assert.rejects(
    useCase.execute(manageContext, {
      projectId: PROJECT_ID,
      name: '   ',
    }),
    (error: unknown) =>
      error instanceof ApplicationError &&
      error.code === 'VALIDATION_FAILED' &&
      error.details?.field === 'name',
  );

  assert.equal(unitOfWork.executions, 0);
});

test('accepts planned date ranges when start is before end', async () => {
  const milestones = new InMemoryMilestoneRepository();
  const unitOfWork = new InMemoryUnitOfWork({
    milestones,
    projects: new InMemoryProjectRepository(projectFixture(ORGANIZATION_ID, PROJECT_ID)),
    audit: new InMemoryAuditRepository(),
    events: new InMemoryEventRepository(),
  });
  const useCase = new CreateMilestoneUseCase(unitOfWork, new FixedClock(NOW));

  await useCase.execute(manageContext, {
    projectId: PROJECT_ID,
    name: 'IND Submission',
    plannedStartDate: new Date('2026-08-01T12:00:00.000Z'),
    plannedEndDate: new Date('2026-08-15T12:00:00.000Z'),
  });

  assert.equal(unitOfWork.executions, 1);
  assert.equal(
    milestones.createdInput?.plannedStartDate?.toISOString(),
    '2026-08-01T12:00:00.000Z',
  );
  assert.equal(
    milestones.createdInput?.plannedEndDate?.toISOString(),
    '2026-08-15T12:00:00.000Z',
  );
});

test('accepts planned date ranges when start equals end', async () => {
  const milestones = new InMemoryMilestoneRepository();
  const unitOfWork = new InMemoryUnitOfWork({
    milestones,
    projects: new InMemoryProjectRepository(projectFixture(ORGANIZATION_ID, PROJECT_ID)),
    audit: new InMemoryAuditRepository(),
    events: new InMemoryEventRepository(),
  });
  const useCase = new CreateMilestoneUseCase(unitOfWork, new FixedClock(NOW));
  const sameDay = new Date('2026-08-01T12:00:00.000Z');

  await useCase.execute(manageContext, {
    projectId: PROJECT_ID,
    name: 'IND Submission',
    plannedStartDate: sameDay,
    plannedEndDate: sameDay,
  });

  assert.equal(unitOfWork.executions, 1);
  assert.equal(
    milestones.createdInput?.plannedStartDate?.toISOString(),
    sameDay.toISOString(),
  );
  assert.equal(
    milestones.createdInput?.plannedEndDate?.toISOString(),
    sameDay.toISOString(),
  );
});

test('rejects planned date ranges when start is after end', async () => {
  const unitOfWork = new InMemoryUnitOfWork({
    milestones: new InMemoryMilestoneRepository(),
    projects: new InMemoryProjectRepository(projectFixture(ORGANIZATION_ID, PROJECT_ID)),
    audit: new InMemoryAuditRepository(),
    events: new InMemoryEventRepository(),
  });
  const useCase = new CreateMilestoneUseCase(unitOfWork);

  await assert.rejects(
    useCase.execute(manageContext, {
      projectId: PROJECT_ID,
      name: 'IND Submission',
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

test('accepts actual date ranges when start is before end', async () => {
  const milestones = new InMemoryMilestoneRepository();
  const unitOfWork = new InMemoryUnitOfWork({
    milestones,
    projects: new InMemoryProjectRepository(projectFixture(ORGANIZATION_ID, PROJECT_ID)),
    audit: new InMemoryAuditRepository(),
    events: new InMemoryEventRepository(),
  });
  const useCase = new CreateMilestoneUseCase(unitOfWork, new FixedClock(NOW));

  await useCase.execute(manageContext, {
    projectId: PROJECT_ID,
    name: 'IND Submission',
    actualStartDate: new Date('2026-08-01T12:00:00.000Z'),
    actualEndDate: new Date('2026-08-15T12:00:00.000Z'),
  });

  assert.equal(unitOfWork.executions, 1);
});

test('accepts actual date ranges when start equals end', async () => {
  const milestones = new InMemoryMilestoneRepository();
  const unitOfWork = new InMemoryUnitOfWork({
    milestones,
    projects: new InMemoryProjectRepository(projectFixture(ORGANIZATION_ID, PROJECT_ID)),
    audit: new InMemoryAuditRepository(),
    events: new InMemoryEventRepository(),
  });
  const useCase = new CreateMilestoneUseCase(unitOfWork, new FixedClock(NOW));
  const sameDay = new Date('2026-08-01T12:00:00.000Z');

  await useCase.execute(manageContext, {
    projectId: PROJECT_ID,
    name: 'IND Submission',
    actualStartDate: sameDay,
    actualEndDate: sameDay,
  });

  assert.equal(unitOfWork.executions, 1);
});

test('rejects actual date ranges when start is after end', async () => {
  const unitOfWork = new InMemoryUnitOfWork({
    milestones: new InMemoryMilestoneRepository(),
    projects: new InMemoryProjectRepository(projectFixture(ORGANIZATION_ID, PROJECT_ID)),
    audit: new InMemoryAuditRepository(),
    events: new InMemoryEventRepository(),
  });
  const useCase = new CreateMilestoneUseCase(unitOfWork);

  await assert.rejects(
    useCase.execute(manageContext, {
      projectId: PROJECT_ID,
      name: 'IND Submission',
      actualStartDate: new Date('2026-09-01T12:00:00.000Z'),
      actualEndDate: new Date('2026-08-01T12:00:00.000Z'),
    }),
    (error: unknown) =>
      error instanceof ApplicationError &&
      error.code === 'VALIDATION_FAILED' &&
      error.details?.field === 'actualStartDate',
  );

  assert.equal(unitOfWork.executions, 0);
});

test('rejects create attempts without milestones.manage permission', async () => {
  const useCase = new CreateMilestoneUseCase(
    new InMemoryUnitOfWork({
      milestones: new InMemoryMilestoneRepository(),
      projects: new InMemoryProjectRepository(projectFixture(ORGANIZATION_ID, PROJECT_ID)),
      audit: new InMemoryAuditRepository(),
      events: new InMemoryEventRepository(),
    }),
  );

  await assert.rejects(
    useCase.execute(
      { ...manageContext, role: 'VIEWER' },
      { projectId: PROJECT_ID, name: 'IND Submission' },
    ),
    AuthorizationDeniedError,
  );
});

test('uses organizationId from context rather than client-controlled input', async () => {
  const milestones = new InMemoryMilestoneRepository();
  const unitOfWork = new InMemoryUnitOfWork({
    milestones,
    projects: new InMemoryProjectRepository(projectFixture(ORGANIZATION_ID, PROJECT_ID)),
    audit: new InMemoryAuditRepository(),
    events: new InMemoryEventRepository(),
  });
  const useCase = new CreateMilestoneUseCase(unitOfWork, new FixedClock(NOW));

  await useCase.execute(
    { ...manageContext, organizationId: ORGANIZATION_ID },
    { projectId: PROJECT_ID, name: 'Scoped Milestone' },
  );

  assert.equal(milestones.createdInput?.organizationId, ORGANIZATION_ID);
  assert.notEqual(milestones.createdInput?.organizationId, OTHER_ORGANIZATION_ID);
});

function milestoneFixture(input: RepositoryCreateMilestoneInput): Milestone {
  return {
    id: MILESTONE_ID,
    organizationId: input.organizationId,
    projectId: input.projectId,
    name: input.name,
    ...(input.description === undefined ? {} : { description: input.description }),
    status: input.status ?? 'PLANNED',
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
