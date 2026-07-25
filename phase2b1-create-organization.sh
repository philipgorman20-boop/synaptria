#!/usr/bin/env bash
set -euo pipefail

mkdir -p packages/application/src/modules/organization

cat > packages/application/package.json <<'JSON'
{
  "name": "@synaptria/application",
  "version": "0.0.0",
  "private": true,
  "type": "module",
  "exports": {
    ".": "./src/index.ts",
    "./organization": "./src/modules/organization/index.ts",
    "./finance": "./src/modules/finance/index.ts",
    "./programs": "./src/modules/programs/index.ts",
    "./vendors": "./src/modules/vendors/index.ts",
    "./documents": "./src/modules/documents/index.ts",
    "./reporting": "./src/modules/reporting/index.ts",
    "./dashboard": "./src/modules/dashboard/index.ts",
    "./ai": "./src/modules/ai/index.ts"
  },
  "scripts": {
    "build": "tsc --noEmit",
    "lint": "tsc --noEmit",
    "typecheck": "tsc --noEmit",
    "test": "node --import tsx --test src/**/*.test.ts"
  },
  "dependencies": {
    "@synaptria/audit": "workspace:*",
    "@synaptria/core": "workspace:*",
    "@synaptria/domain": "workspace:*",
    "@synaptria/events": "workspace:*",
    "@synaptria/types": "workspace:*"
  },
  "devDependencies": {
    "@types/node": "^22.20.1",
    "tsx": "^4.23.1",
    "typescript": "^5.8.3"
  }
}
JSON

cat > packages/application/src/modules/organization/organization-unit-of-work.ts <<'EOF'
import type { AuditRepository } from '@synaptria/audit';
import type {
  MembershipRepository,
  OrganizationRepository,
} from '@synaptria/domain/organization';
import type { EventRepository } from '@synaptria/events';

/** Repositories that must participate in one atomic organization transaction. */
export interface OrganizationTransactionRepositories {
  readonly organizations: OrganizationRepository;
  readonly memberships: MembershipRepository;
  readonly audit: AuditRepository;
  readonly events: EventRepository;
}

/**
 * Application-facing transaction boundary.
 *
 * Infrastructure supplies the implementation. The application layer does not
 * depend on Prisma or any other persistence technology.
 */
export interface OrganizationUnitOfWork {
  execute<T>(
    operation: (
      repositories: OrganizationTransactionRepositories,
    ) => Promise<T>,
  ): Promise<T>;
}
EOF

cat > packages/application/src/modules/organization/create-organization.ts <<'EOF'
import { AuditService } from '@synaptria/audit';
import {
  CryptoIdGenerator,
  SystemClock,
  type Clock,
  type CorrelationId,
  type IdGenerator,
  type RequestId,
  type UserId,
} from '@synaptria/core';
import type {
  Organization,
  OrganizationMembership,
  OrganizationSettings,
} from '@synaptria/domain/organization';
import { DomainEventService } from '@synaptria/events';

import { ApplicationError } from '../../shared/application-error';
import type { OrganizationUnitOfWork } from './organization-unit-of-work';

export interface CreateOrganizationContext {
  readonly userId: UserId;
  readonly requestId: RequestId;
  readonly correlationId: CorrelationId;
}

export interface CreateOrganizationInput {
  readonly name: string;
  readonly slug: string;
  readonly legalName?: string;
  readonly defaultCurrency?: string;
  readonly fiscalYearStartMonth?: number;
  readonly timezone?: string;
  readonly countryCode?: string;
  readonly settings?: OrganizationSettings;
}

export interface CreateOrganizationOutput {
  readonly organization: Organization;
  readonly membership: OrganizationMembership;
}

export class CreateOrganizationUseCase {
  constructor(
    private readonly unitOfWork: OrganizationUnitOfWork,
    private readonly clock: Clock = new SystemClock(),
    private readonly eventIdGenerator: IdGenerator = new CryptoIdGenerator(),
  ) {}

  async execute(
    context: CreateOrganizationContext,
    input: CreateOrganizationInput,
  ): Promise<CreateOrganizationOutput> {
    const normalized = normalizeInput(input);
    const occurredAt = this.clock.now();

    return this.unitOfWork.execute(async (repositories) => {
      const existing = await repositories.organizations.findBySlug(
        normalized.slug,
      );

      if (existing !== null) {
        throw new ApplicationError({
          code: 'CONFLICT',
          message: 'An organization with this slug already exists.',
          details: { slug: normalized.slug },
        });
      }

      const organization = await repositories.organizations.create(normalized);
      const membership = await repositories.memberships.add({
        organizationId: organization.id,
        userId: context.userId,
        role: 'OWNER',
        status: 'ACTIVE',
        joinedAt: occurredAt,
      });

      const audit = new AuditService(repositories.audit, this.clock);
      await audit.record({
        organizationId: organization.id,
        actor: {
          type: 'USER',
          id: context.userId,
          userId: context.userId,
        },
        action: 'CREATE',
        target: {
          entityType: 'Organization',
          entityId: organization.id,
        },
        request: {
          requestId: context.requestId,
          correlationId: context.correlationId,
        },
        after: {
          id: organization.id,
          name: organization.name,
          slug: organization.slug,
          ownerMembershipId: membership.id,
        },
        occurredAt,
      });

      const events = new DomainEventService(
        repositories.events,
        this.clock,
        this.eventIdGenerator,
      );
      await events.publishSystem({
        organizationId: organization.id,
        actorId: context.userId,
        requestId: context.requestId,
        correlationId: context.correlationId,
        event: {
          type: 'organization.created',
          aggregateType: 'Organization',
          aggregateId: organization.id,
          payload: {
            organizationId: organization.id,
            name: organization.name,
            slug: organization.slug,
            ownerUserId: context.userId,
            ownerMembershipId: membership.id,
          },
          occurredAt,
        },
      });

      return { organization, membership };
    });
  }
}

function normalizeInput(
  input: CreateOrganizationInput,
): CreateOrganizationInput {
  const name = requireText(input.name, 'name');
  const slug = normalizeSlug(input.slug);

  if (
    input.fiscalYearStartMonth !== undefined &&
    (!Number.isInteger(input.fiscalYearStartMonth) ||
      input.fiscalYearStartMonth < 1 ||
      input.fiscalYearStartMonth > 12)
  ) {
    throw validationError(
      'fiscalYearStartMonth must be an integer between 1 and 12.',
      'fiscalYearStartMonth',
    );
  }

  const defaultCurrency = input.defaultCurrency?.trim().toUpperCase();
  if (
    defaultCurrency !== undefined &&
    !/^[A-Z]{3}$/.test(defaultCurrency)
  ) {
    throw validationError(
      'defaultCurrency must be a three-letter currency code.',
      'defaultCurrency',
    );
  }

  const countryCode = input.countryCode?.trim().toUpperCase();
  if (countryCode !== undefined && !/^[A-Z]{2}$/.test(countryCode)) {
    throw validationError(
      'countryCode must be a two-letter country code.',
      'countryCode',
    );
  }

  return {
    name,
    slug,
    ...(input.legalName === undefined
      ? {}
      : { legalName: requireText(input.legalName, 'legalName') }),
    ...(defaultCurrency === undefined ? {} : { defaultCurrency }),
    ...(input.fiscalYearStartMonth === undefined
      ? {}
      : { fiscalYearStartMonth: input.fiscalYearStartMonth }),
    ...(input.timezone === undefined
      ? {}
      : { timezone: requireText(input.timezone, 'timezone') }),
    ...(countryCode === undefined ? {} : { countryCode }),
    ...(input.settings === undefined ? {} : { settings: input.settings }),
  };
}

function requireText(value: string, field: string): string {
  const normalized = value.trim();
  if (normalized.length === 0) {
    throw validationError(`${field} cannot be empty.`, field);
  }
  return normalized;
}

function normalizeSlug(value: string): string {
  const slug = value.trim().toLowerCase();
  if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug)) {
    throw validationError(
      'slug must contain lowercase letters, numbers, and single hyphens only.',
      'slug',
    );
  }
  return slug;
}

function validationError(message: string, field: string): ApplicationError {
  return new ApplicationError({
    code: 'VALIDATION_FAILED',
    message,
    details: { field },
  });
}
EOF

cat > packages/application/src/modules/organization/create-organization.test.ts <<'EOF'
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
EOF

cat > packages/application/src/modules/organization/index.ts <<'EOF'
export * from './create-organization';
export * from './organization-unit-of-work';

/** Public application-layer identifier for the Organization module. */
export const organizationModule = 'organization' as const;
EOF

printf '%s\n' 'Phase 2B.1 files installed.'
