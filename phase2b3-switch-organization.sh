#!/usr/bin/env bash
set -euo pipefail

if [[ ! -f "pnpm-workspace.yaml" || ! -d "packages/application" ]]; then
  echo "Run this script from the Synaptria repository root." >&2
  exit 1
fi

TARGET="packages/application/src/modules/organization"
mkdir -p "$TARGET"

cat > "$TARGET/switch-organization.ts" <<'EOF'
import { AuditService } from '@synaptria/audit';
import {
  CryptoIdGenerator,
  SystemClock,
  failure,
  success,
  type Clock,
  type CorrelationId,
  type IdGenerator,
  type OrganizationId,
  type RequestId,
  type Result,
  type UserId,
} from '@synaptria/core';
import type {
  MembershipStatus,
  Organization,
  OrganizationMembership,
} from '@synaptria/domain/organization';
import { DomainEventService } from '@synaptria/events';

import type { OrganizationUnitOfWork } from './organization-unit-of-work';

export interface SwitchOrganizationContext {
  readonly userId: UserId;
  readonly requestId: RequestId;
  readonly correlationId: CorrelationId;
  readonly currentOrganizationId?: OrganizationId;
}

export interface SwitchOrganizationInput {
  readonly organizationId: OrganizationId;
}

export interface SwitchOrganizationOutput {
  readonly organization: Organization;
  readonly membership: OrganizationMembership;
  readonly changed: boolean;
  readonly previousOrganizationId?: OrganizationId;
}

export type SwitchOrganizationError =
  | Readonly<{
      code: 'ORGANIZATION_NOT_FOUND';
      message: string;
      organizationId: OrganizationId;
    }>
  | Readonly<{
      code: 'MEMBERSHIP_REQUIRED';
      message: string;
      organizationId: OrganizationId;
      userId: UserId;
    }>
  | Readonly<{
      code: 'MEMBERSHIP_INACTIVE';
      message: string;
      organizationId: OrganizationId;
      userId: UserId;
      status: MembershipStatus;
    }>;

export type SwitchOrganizationResult = Result<
  SwitchOrganizationOutput,
  SwitchOrganizationError
>;

/**
 * Validates and records an authenticated user's change of active tenant.
 *
 * Cookie persistence belongs to the web delivery layer. This use case returns
 * the validated organization and membership that the web layer may safely use
 * when updating the active-organization cookie.
 */
export class SwitchOrganizationUseCase {
  constructor(
    private readonly unitOfWork: OrganizationUnitOfWork,
    private readonly clock: Clock = new SystemClock(),
    private readonly eventIdGenerator: IdGenerator = new CryptoIdGenerator(),
  ) {}

  async execute(
    context: SwitchOrganizationContext,
    input: SwitchOrganizationInput,
  ): Promise<SwitchOrganizationResult> {
    return this.unitOfWork.execute(async (repositories) => {
      const organization = await repositories.organizations.findById(
        input.organizationId,
      );

      if (organization === null) {
        return failure({
          code: 'ORGANIZATION_NOT_FOUND',
          message: 'The requested organization was not found.',
          organizationId: input.organizationId,
        });
      }

      const membership = await repositories.memberships.findForUser(
        organization.id,
        context.userId,
      );

      if (membership === null) {
        return failure({
          code: 'MEMBERSHIP_REQUIRED',
          message: 'An organization membership is required.',
          organizationId: organization.id,
          userId: context.userId,
        });
      }

      if (membership.status !== 'ACTIVE') {
        return failure({
          code: 'MEMBERSHIP_INACTIVE',
          message: 'The organization membership is not active.',
          organizationId: organization.id,
          userId: context.userId,
          status: membership.status,
        });
      }

      if (context.currentOrganizationId === organization.id) {
        return success({
          organization,
          membership,
          changed: false,
          previousOrganizationId: context.currentOrganizationId,
        });
      }

      const switchedAt = this.clock.now();
      const audit = new AuditService(repositories.audit, this.clock);
      await audit.record({
        organizationId: organization.id,
        actor: {
          type: 'USER',
          id: context.userId,
          userId: context.userId,
        },
        action: 'CUSTOM',
        target: {
          entityType: 'OrganizationContext',
          entityId: organization.id,
        },
        request: {
          requestId: context.requestId,
          correlationId: context.correlationId,
        },
        before: {
          organizationId: context.currentOrganizationId ?? null,
        },
        after: {
          organizationId: organization.id,
          membershipId: membership.id,
          role: membership.role,
        },
        metadata: {
          operation: 'organization.switched',
        },
        occurredAt: switchedAt,
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
          type: 'organization.switched',
          aggregateType: 'Organization',
          aggregateId: organization.id,
          payload: {
            userId: context.userId,
            previousOrganizationId: context.currentOrganizationId ?? null,
            currentOrganizationId: organization.id,
            membershipId: membership.id,
            switchedAt: switchedAt.toISOString(),
          },
          occurredAt: switchedAt,
        },
      });

      return success({
        organization,
        membership,
        changed: true,
        ...(context.currentOrganizationId === undefined
          ? {}
          : { previousOrganizationId: context.currentOrganizationId }),
      });
    });
  }
}
EOF

cat > "$TARGET/switch-organization.test.ts" <<'EOF'
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
EOF

cat > "$TARGET/organization-service.ts" <<'EOF'
import type {
  CreateOrganizationContext,
  CreateOrganizationInput,
  CreateOrganizationOutput,
} from './create-organization';
import { CreateOrganizationUseCase } from './create-organization';
import type {
  ListOrganizationsContext,
  ListOrganizationsOutput,
} from './list-organizations';
import { ListOrganizationsUseCase } from './list-organizations';
import type {
  SwitchOrganizationContext,
  SwitchOrganizationInput,
  SwitchOrganizationResult,
} from './switch-organization';
import { SwitchOrganizationUseCase } from './switch-organization';

/** Application facade consumed by delivery mechanisms such as Next.js. */
export class OrganizationService {
  constructor(
    private readonly createOrganizationUseCase: CreateOrganizationUseCase,
    private readonly listOrganizationsUseCase: ListOrganizationsUseCase,
    private readonly switchOrganizationUseCase: SwitchOrganizationUseCase,
  ) {}

  createOrganization(
    context: CreateOrganizationContext,
    input: CreateOrganizationInput,
  ): Promise<CreateOrganizationOutput> {
    return this.createOrganizationUseCase.execute(context, input);
  }

  listOrganizations(
    context: ListOrganizationsContext,
  ): Promise<ListOrganizationsOutput> {
    return this.listOrganizationsUseCase.execute(context);
  }

  switchOrganization(
    context: SwitchOrganizationContext,
    input: SwitchOrganizationInput,
  ): Promise<SwitchOrganizationResult> {
    return this.switchOrganizationUseCase.execute(context, input);
  }
}
EOF

cat > "$TARGET/organization-service.test.ts" <<'EOF'
import assert from 'node:assert/strict';
import test from 'node:test';

import {
  correlationId,
  organizationId,
  requestId,
  success,
  userId,
} from '@synaptria/core';

import type {
  CreateOrganizationContext,
  CreateOrganizationInput,
  CreateOrganizationOutput,
  CreateOrganizationUseCase,
} from './create-organization';
import type {
  ListOrganizationsContext,
  ListOrganizationsOutput,
  ListOrganizationsUseCase,
} from './list-organizations';
import { OrganizationService } from './organization-service';
import type {
  SwitchOrganizationContext,
  SwitchOrganizationInput,
  SwitchOrganizationResult,
  SwitchOrganizationUseCase,
} from './switch-organization';

const USER_ID = userId('user-1');

class CreateOrganizationStub {
  received?: Readonly<{
    context: CreateOrganizationContext;
    input: CreateOrganizationInput;
  }>;

  constructor(private readonly output: CreateOrganizationOutput) {}

  async execute(
    context: CreateOrganizationContext,
    input: CreateOrganizationInput,
  ): Promise<CreateOrganizationOutput> {
    this.received = { context, input };
    return this.output;
  }
}

class ListOrganizationsStub {
  received?: ListOrganizationsContext;

  constructor(private readonly output: ListOrganizationsOutput) {}

  async execute(
    context: ListOrganizationsContext,
  ): Promise<ListOrganizationsOutput> {
    this.received = context;
    return this.output;
  }
}

class SwitchOrganizationStub {
  received?: Readonly<{
    context: SwitchOrganizationContext;
    input: SwitchOrganizationInput;
  }>;

  constructor(private readonly output: SwitchOrganizationResult) {}

  async execute(
    context: SwitchOrganizationContext,
    input: SwitchOrganizationInput,
  ): Promise<SwitchOrganizationResult> {
    this.received = { context, input };
    return this.output;
  }
}

test('organization service delegates to create, list, and switch use cases', async () => {
  const now = new Date('2026-07-22T18:00:00.000Z');
  const orgId = organizationId('org-1');
  const createOutput: CreateOrganizationOutput = {
    organization: {
      id: orgId,
      name: 'Synaptria Labs',
      slug: 'synaptria-labs',
      defaultCurrency: 'USD',
      fiscalYearStartMonth: 1,
      timezone: 'UTC',
      countryCode: 'US',
      createdAt: now,
      updatedAt: now,
    },
    membership: {
      id: 'membership-1' as CreateOrganizationOutput['membership']['id'],
      organizationId: orgId,
      userId: USER_ID,
      role: 'OWNER',
      status: 'ACTIVE',
      joinedAt: now,
      createdAt: now,
      updatedAt: now,
    },
  };
  const listOutput: ListOrganizationsOutput = {
    organizations: [{ ...createOutput, isActive: true }],
    activeOrganizationId: orgId,
  };
  const switchOutput = success({
    organization: createOutput.organization,
    membership: createOutput.membership,
    changed: false,
    previousOrganizationId: orgId,
  });

  const create = new CreateOrganizationStub(createOutput);
  const list = new ListOrganizationsStub(listOutput);
  const switchOrganization = new SwitchOrganizationStub(switchOutput);
  const service = new OrganizationService(
    create as unknown as CreateOrganizationUseCase,
    list as unknown as ListOrganizationsUseCase,
    switchOrganization as unknown as SwitchOrganizationUseCase,
  );

  const createContext = {
    userId: USER_ID,
    requestId: requestId('request-1'),
    correlationId: correlationId('correlation-1'),
  };
  const createInput = {
    name: 'Synaptria Labs',
    slug: 'synaptria-labs',
  };
  const listContext = {
    userId: USER_ID,
    activeOrganizationId: orgId,
  };
  const switchContext = {
    userId: USER_ID,
    requestId: requestId('request-switch-1'),
    correlationId: correlationId('correlation-switch-1'),
    currentOrganizationId: orgId,
  };
  const switchInput = { organizationId: orgId };

  assert.equal(
    await service.createOrganization(createContext, createInput),
    createOutput,
  );
  assert.equal(await service.listOrganizations(listContext), listOutput);
  assert.equal(
    await service.switchOrganization(switchContext, switchInput),
    switchOutput,
  );
  assert.deepEqual(create.received, {
    context: createContext,
    input: createInput,
  });
  assert.deepEqual(list.received, listContext);
  assert.deepEqual(switchOrganization.received, {
    context: switchContext,
    input: switchInput,
  });
});
EOF

cat > "$TARGET/index.ts" <<'EOF'
export * from './create-organization';
export * from './list-organizations';
export * from './organization-service';
export * from './organization-unit-of-work';
export * from './switch-organization';

/** Public application-layer identifier for the Organization module. */
export const organizationModule = 'organization' as const;
EOF

chmod +x /dev/null 2>/dev/null || true

echo "Phase 2B.3 files installed."
echo "Run the validation commands provided in ChatGPT."
