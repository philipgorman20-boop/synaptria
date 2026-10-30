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
  requestId,
  userId,
  type IdGenerator,
  type OrganizationId,
} from '@synaptria/core';
import type {
  AddMembershipInput,
  CreateOrganizationInput,
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

import type {
  OrganizationTransactionRepositories,
  OrganizationUnitOfWork,
} from './organization-unit-of-work';
import { SwitchOrganizationUseCase } from './switch-organization';

const NOW = new Date('2026-07-22T18:00:00.000Z');
const USER_ID = userId('user-1');
const CURRENT_ORGANIZATION_ID = organizationId('org-current');
const TARGET_ORGANIZATION_ID = organizationId('org-target');
const TARGET_MEMBERSHIP_ID = membershipId('membership-target');

class FixedIdGenerator implements IdGenerator {
  generate(): string {
    return 'event-switch-1';
  }
}

class OrganizationRepositoryStub implements OrganizationRepository {
  organization: Organization | null = organizationFixture();

  async findById(): Promise<Organization | null> {
    return this.organization;
  }

  async create(_input: CreateOrganizationInput): Promise<Organization> {
    throw new Error('Not implemented in this test.');
  }

  async findBySlug(): Promise<Organization | null> {
    return null;
  }

  async update(
    _id: OrganizationId,
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

class MembershipRepositoryStub implements MembershipRepository {
  membership: OrganizationMembership | null = membershipFixture('ACTIVE');

  async findForUser(): Promise<OrganizationMembership | null> {
    return this.membership;
  }

  async add(_input: AddMembershipInput): Promise<OrganizationMembership> {
    throw new Error('Not implemented in this test.');
  }

  async findById(): Promise<OrganizationMembership | null> {
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

  async updateStatus(): Promise<OrganizationMembership> {
    throw new Error('Not implemented in this test.');
  }

  async isActiveMember(): Promise<boolean> {
    return this.membership?.status === 'ACTIVE';
  }
}

class AuditRepositoryStub implements AuditRepository {
  inputs: RecordAuditEventInput[] = [];

  async create(input: RecordAuditEventInput): Promise<AuditEventRecord> {
    this.inputs.push(input);
    return {
      id: 'audit-switch-1',
      ...input,
      occurredAt: input.occurredAt ?? NOW,
    };
  }
}

class EventRepositoryStub implements EventRepository {
  events: DomainEventEnvelope[] = [];

  async append(event: DomainEventEnvelope): Promise<DomainEventEnvelope> {
    this.events.push(event);
    return event;
  }

  async appendMany(
    events: readonly DomainEventEnvelope[],
  ): Promise<readonly DomainEventEnvelope[]> {
    this.events.push(...events);
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

class UnitOfWorkStub implements OrganizationUnitOfWork {
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

function createFixture(): Readonly<{
  organizations: OrganizationRepositoryStub;
  memberships: MembershipRepositoryStub;
  audit: AuditRepositoryStub;
  events: EventRepositoryStub;
  unitOfWork: UnitOfWorkStub;
  useCase: SwitchOrganizationUseCase;
}> {
  const organizations = new OrganizationRepositoryStub();
  const memberships = new MembershipRepositoryStub();
  const audit = new AuditRepositoryStub();
  const events = new EventRepositoryStub();
  const unitOfWork = new UnitOfWorkStub({
    organizations,
    memberships,
    audit,
    events,
  });

  return {
    organizations,
    memberships,
    audit,
    events,
    unitOfWork,
    useCase: new SwitchOrganizationUseCase(
      unitOfWork,
      new FixedClock(NOW),
      new FixedIdGenerator(),
    ),
  };
}

test('switches to an accessible organization and records audit and domain events', async () => {
  const fixture = createFixture();

  const result = await fixture.useCase.execute(
    context(CURRENT_ORGANIZATION_ID),
    { organizationId: TARGET_ORGANIZATION_ID },
  );

  assert.equal(result.ok, true);
  if (!result.ok) return;

  assert.equal(result.value.changed, true);
  assert.equal(result.value.organization.id, TARGET_ORGANIZATION_ID);
  assert.equal(result.value.membership.id, TARGET_MEMBERSHIP_ID);
  assert.equal(
    result.value.previousOrganizationId,
    CURRENT_ORGANIZATION_ID,
  );
  assert.equal(fixture.audit.inputs.length, 1);
  assert.equal(fixture.audit.inputs[0]?.action, 'CUSTOM');
  assert.deepEqual(fixture.audit.inputs[0]?.metadata, {
    operation: 'organization.switched',
  });
  assert.equal(fixture.events.events.length, 1);
  assert.equal(
    fixture.events.events[0]?.eventType,
    'organization.switched',
  );
  assert.deepEqual(fixture.events.events[0]?.occurredAt, NOW);
});

test('returns organization-not-found without writing audit or events', async () => {
  const fixture = createFixture();
  fixture.organizations.organization = null;

  const result = await fixture.useCase.execute(context(), {
    organizationId: TARGET_ORGANIZATION_ID,
  });

  assert.deepEqual(result, {
    ok: false,
    error: {
      code: 'ORGANIZATION_NOT_FOUND',
      message: 'The requested organization was not found.',
      organizationId: TARGET_ORGANIZATION_ID,
    },
  });
  assert.equal(fixture.audit.inputs.length, 0);
  assert.equal(fixture.events.events.length, 0);
});

test('returns membership-required when the user has no membership', async () => {
  const fixture = createFixture();
  fixture.memberships.membership = null;

  const result = await fixture.useCase.execute(context(), {
    organizationId: TARGET_ORGANIZATION_ID,
  });

  assert.equal(result.ok, false);
  if (result.ok) return;
  assert.equal(result.error.code, 'MEMBERSHIP_REQUIRED');
  assert.equal(fixture.audit.inputs.length, 0);
  assert.equal(fixture.events.events.length, 0);
});

test('returns membership-inactive for suspended memberships', async () => {
  const fixture = createFixture();
  fixture.memberships.membership = membershipFixture('SUSPENDED');

  const result = await fixture.useCase.execute(context(), {
    organizationId: TARGET_ORGANIZATION_ID,
  });

  assert.equal(result.ok, false);
  if (result.ok) return;
  assert.equal(result.error.code, 'MEMBERSHIP_INACTIVE');
  assert.equal(result.error.status, 'SUSPENDED');
  assert.equal(fixture.audit.inputs.length, 0);
  assert.equal(fixture.events.events.length, 0);
});

test('treats selecting the current organization as a successful no-op', async () => {
  const fixture = createFixture();

  const result = await fixture.useCase.execute(
    context(TARGET_ORGANIZATION_ID),
    { organizationId: TARGET_ORGANIZATION_ID },
  );

  assert.equal(result.ok, true);
  if (!result.ok) return;
  assert.equal(result.value.changed, false);
  assert.equal(fixture.audit.inputs.length, 0);
  assert.equal(fixture.events.events.length, 0);
});

function context(currentOrganizationId?: OrganizationId) {
  return {
    userId: USER_ID,
    requestId: requestId('request-switch-1'),
    correlationId: correlationId('correlation-switch-1'),
    ...(currentOrganizationId === undefined
      ? {}
      : { currentOrganizationId }),
  };
}

function organizationFixture(): Organization {
  return {
    id: TARGET_ORGANIZATION_ID,
    name: 'Target Bio',
    slug: 'target-bio',
    defaultCurrency: 'USD',
    fiscalYearStartMonth: 1,
    timezone: 'America/New_York',
    countryCode: 'US',
    createdAt: NOW,
    updatedAt: NOW,
  };
}

function membershipFixture(
  status: MembershipStatus,
): OrganizationMembership {
  return {
    id: TARGET_MEMBERSHIP_ID,
    organizationId: TARGET_ORGANIZATION_ID,
    userId: USER_ID,
    role: 'OWNER',
    status,
    joinedAt: NOW,
    createdAt: NOW,
    updatedAt: NOW,
  };
}
