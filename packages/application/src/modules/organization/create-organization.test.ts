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
  identifier,
  membershipId,
  organizationId,
  requestId,
  userId,
  type IdGenerator,
} from '@synaptria/core';
import type {
  AddMembershipInput,
  CreateOrganizationInput as RepositoryCreateOrganizationInput,
  MembershipRepository,
  MembershipStatus,
  Organization,
  OrganizationMembership,
  OrganizationRepository,
  OrganizationSummary,
  UpdateOrganizationInput,
} from '@synaptria/domain/organization';
import type {
  AggregateEventQuery,
  DomainEventEnvelope,
  DomainEventId,
  DomainEventStatus,
  EventRepository,
  OrganizationRecentEventsQuery,
} from '@synaptria/events';

import { ApplicationError } from '../../shared/application-error';
import { CreateOrganizationUseCase } from './create-organization';
import type {
  OrganizationTransactionRepositories,
  OrganizationUnitOfWork,
} from './organization-unit-of-work';

const NOW = new Date('2026-07-22T16:00:00.000Z');
const USER_ID = userId('user-1');
const ORGANIZATION_ID = organizationId('org-1');
const MEMBERSHIP_ID = membershipId('membership-1');

class FixedIdGenerator implements IdGenerator {
  generate(): string {
    return 'event-1';
  }
}

class InMemoryOrganizationRepository implements OrganizationRepository {
  createdInput?: RepositoryCreateOrganizationInput;
  existing: Organization | null = null;

  async create(
    input: RepositoryCreateOrganizationInput,
  ): Promise<Organization> {
    this.createdInput = input;
    return organizationFixture(input);
  }

  async findBySlug(): Promise<Organization | null> {
    return this.existing;
  }

  async findById(): Promise<Organization | null> {
    return null;
  }

  async update(
    _id: typeof ORGANIZATION_ID,
    _input: UpdateOrganizationInput,
  ): Promise<Organization> {
    throw new Error('Not implemented in this test.');
  }

  async softDelete(): Promise<Organization> {
    throw new Error('Not implemented in this test.');
  }

  async listForUser(): Promise<readonly OrganizationSummary[]> {
    return [];
  }
}

class InMemoryMembershipRepository implements MembershipRepository {
  addedInput?: AddMembershipInput;

  async add(input: AddMembershipInput): Promise<OrganizationMembership> {
    this.addedInput = input;
    return membershipFixture(input);
  }

  async findById(): Promise<OrganizationMembership | null> {
    return null;
  }

  async findForUser(): Promise<OrganizationMembership | null> {
    return null;
  }

  async listMembers(): Promise<readonly OrganizationMembership[]> {
    return [];
  }

  async listForUser(): Promise<readonly OrganizationMembership[]> {
    return [];
  }

  async updateRole(): Promise<OrganizationMembership> {
    throw new Error('Not implemented in this test.');
  }

  async updateStatus(
    _id: typeof MEMBERSHIP_ID,
    _status: MembershipStatus,
    _changedAt: Date,
  ): Promise<OrganizationMembership> {
    throw new Error('Not implemented in this test.');
  }

  async isActiveMember(): Promise<boolean> {
    return false;
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

class InMemoryUnitOfWork implements OrganizationUnitOfWork {
  executions = 0;

  constructor(
    readonly repositories: OrganizationTransactionRepositories,
  ) {}

  async execute<T>(
    operation: (
      repositories: OrganizationTransactionRepositories,
    ) => Promise<T>,
  ): Promise<T> {
    this.executions += 1;
    return operation(this.repositories);
  }
}

test('creates organization, owner membership, audit record, and domain event', async () => {
  const organizations = new InMemoryOrganizationRepository();
  const memberships = new InMemoryMembershipRepository();
  const audit = new InMemoryAuditRepository();
  const events = new InMemoryEventRepository();
  const unitOfWork = new InMemoryUnitOfWork({
    organizations,
    memberships,
    audit,
    events,
  });

  const useCase = new CreateOrganizationUseCase(
    unitOfWork,
    new FixedClock(NOW),
    new FixedIdGenerator(),
  );

  const output = await useCase.execute(
    {
      userId: USER_ID,
      requestId: requestId('request-1'),
      correlationId: correlationId('correlation-1'),
    },
    {
      name: '  Synaptria Labs  ',
      slug: '  Synaptria-Labs  ',
      defaultCurrency: 'usd',
      countryCode: 'us',
    },
  );

  assert.equal(unitOfWork.executions, 1);
  assert.equal(output.organization.id, ORGANIZATION_ID);
  assert.equal(output.membership.role, 'OWNER');
  assert.deepEqual(organizations.createdInput, {
    name: 'Synaptria Labs',
    slug: 'synaptria-labs',
    defaultCurrency: 'USD',
    countryCode: 'US',
  });
  assert.equal(memberships.addedInput?.organizationId, ORGANIZATION_ID);
  assert.equal(memberships.addedInput?.userId, USER_ID);
  assert.equal(memberships.addedInput?.role, 'OWNER');
  assert.equal(memberships.addedInput?.status, 'ACTIVE');
  assert.deepEqual(memberships.addedInput?.joinedAt, NOW);
  assert.equal(audit.input?.action, 'CREATE');
  assert.equal(audit.input?.target.entityType, 'Organization');
  assert.equal(audit.input?.target.entityId, ORGANIZATION_ID);
  assert.equal(events.event?.eventType, 'organization.created');
  assert.equal(events.event?.aggregateId, ORGANIZATION_ID);
  assert.deepEqual(events.event?.occurredAt, NOW);
});

test('rejects a duplicate slug before writing anything', async () => {
  const organizations = new InMemoryOrganizationRepository();
  organizations.existing = organizationFixture({
    name: 'Existing',
    slug: 'existing',
  });
  const memberships = new InMemoryMembershipRepository();
  const audit = new InMemoryAuditRepository();
  const events = new InMemoryEventRepository();
  const unitOfWork = new InMemoryUnitOfWork({
    organizations,
    memberships,
    audit,
    events,
  });
  const useCase = new CreateOrganizationUseCase(
    unitOfWork,
    new FixedClock(NOW),
    new FixedIdGenerator(),
  );

  await assert.rejects(
    useCase.execute(
      {
        userId: USER_ID,
        requestId: requestId('request-1'),
        correlationId: correlationId('correlation-1'),
      },
      { name: 'Existing', slug: 'existing' },
    ),
    (error: unknown) =>
      error instanceof ApplicationError && error.code === 'CONFLICT',
  );

  assert.equal(organizations.createdInput, undefined);
  assert.equal(memberships.addedInput, undefined);
  assert.equal(audit.input, undefined);
  assert.equal(events.event, undefined);
});

test('rejects invalid organization input before opening a transaction', async () => {
  const unitOfWork = new InMemoryUnitOfWork({
    organizations: new InMemoryOrganizationRepository(),
    memberships: new InMemoryMembershipRepository(),
    audit: new InMemoryAuditRepository(),
    events: new InMemoryEventRepository(),
  });
  const useCase = new CreateOrganizationUseCase(unitOfWork);

  await assert.rejects(
    useCase.execute(
      {
        userId: USER_ID,
        requestId: requestId('request-1'),
        correlationId: correlationId('correlation-1'),
      },
      { name: 'Synaptria', slug: 'Not Valid!' },
    ),
    (error: unknown) =>
      error instanceof ApplicationError &&
      error.code === 'VALIDATION_FAILED',
  );

  assert.equal(unitOfWork.executions, 0);
});

function organizationFixture(
  input: RepositoryCreateOrganizationInput,
): Organization {
  return {
    id: ORGANIZATION_ID,
    name: input.name,
    slug: input.slug,
    ...(input.legalName === undefined ? {} : { legalName: input.legalName }),
    defaultCurrency: input.defaultCurrency ?? 'USD',
    fiscalYearStartMonth: input.fiscalYearStartMonth ?? 1,
    timezone: input.timezone ?? 'America/New_York',
    countryCode: input.countryCode ?? 'US',
    ...(input.settings === undefined ? {} : { settings: input.settings }),
    createdAt: NOW,
    updatedAt: NOW,
  };
}

function membershipFixture(
  input: AddMembershipInput,
): OrganizationMembership {
  return {
    id: MEMBERSHIP_ID,
    organizationId: input.organizationId,
    userId: input.userId,
    role: input.role,
    status: input.status ?? 'ACTIVE',
    ...(input.invitedAt === undefined ? {} : { invitedAt: input.invitedAt }),
    ...(input.joinedAt === undefined ? {} : { joinedAt: input.joinedAt }),
    createdAt: NOW,
    updatedAt: NOW,
  };
}
