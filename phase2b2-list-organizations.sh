#!/usr/bin/env bash
set -euo pipefail

if [[ ! -f "pnpm-workspace.yaml" || ! -d "packages/application" ]]; then
  echo "Run this script from the Synaptria repository root." >&2
  exit 1
fi

TARGET="packages/application/src/modules/organization"
mkdir -p "$TARGET"

cat > "$TARGET/list-organizations.ts" <<'EOF'
import type { OrganizationId, UserId } from '@synaptria/core';
import type {
  Organization,
  OrganizationMembership,
  OrganizationRepository,
  OrganizationSummary,
} from '@synaptria/domain/organization';

export interface ListOrganizationsContext {
  readonly userId: UserId;
  readonly activeOrganizationId?: OrganizationId;
}

export interface OrganizationListItem {
  readonly organization: Organization;
  readonly membership: OrganizationMembership;
  readonly isActive: boolean;
}

export interface ListOrganizationsOutput {
  readonly organizations: readonly OrganizationListItem[];
  readonly activeOrganizationId?: OrganizationId;
}

/**
 * Lists organizations that the authenticated user may actively access.
 *
 * The persistence adapter already scopes this query to active memberships and
 * non-deleted organizations. The application layer repeats those checks so a
 * different repository implementation cannot accidentally expose inaccessible
 * tenants.
 */
export class ListOrganizationsUseCase {
  constructor(
    private readonly organizations: OrganizationRepository,
  ) {}

  async execute(
    context: ListOrganizationsContext,
  ): Promise<ListOrganizationsOutput> {
    const summaries = await this.organizations.listForUser(context.userId);
    const accessible = summaries
      .filter(isAccessibleSummary)
      .sort(compareOrganizationSummaries);

    const activeOrganizationId = resolveActiveOrganizationId(
      accessible,
      context.activeOrganizationId,
    );

    return {
      organizations: accessible.map((summary) => ({
        organization: summary.organization,
        membership: summary.membership,
        isActive: summary.organization.id === activeOrganizationId,
      })),
      ...(activeOrganizationId === undefined
        ? {}
        : { activeOrganizationId }),
    };
  }
}

function isAccessibleSummary(summary: OrganizationSummary): boolean {
  return (
    summary.membership.status === 'ACTIVE' &&
    summary.organization.deletedAt === undefined
  );
}

function compareOrganizationSummaries(
  left: OrganizationSummary,
  right: OrganizationSummary,
): number {
  const nameComparison = left.organization.name.localeCompare(
    right.organization.name,
    'en',
    { sensitivity: 'base' },
  );

  if (nameComparison !== 0) {
    return nameComparison;
  }

  return left.organization.slug.localeCompare(right.organization.slug, 'en', {
    sensitivity: 'base',
  });
}

function resolveActiveOrganizationId(
  summaries: readonly OrganizationSummary[],
  requestedId: OrganizationId | undefined,
): OrganizationId | undefined {
  if (
    requestedId !== undefined &&
    summaries.some((summary) => summary.organization.id === requestedId)
  ) {
    return requestedId;
  }

  return summaries[0]?.organization.id;
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

/**
 * Application-layer facade consumed by delivery mechanisms such as Next.js.
 *
 * The facade keeps route handlers and server actions independent of individual
 * use-case construction while preserving focused, independently testable use
 * cases internally.
 */
export class OrganizationService {
  constructor(
    private readonly createOrganizationUseCase: CreateOrganizationUseCase,
    private readonly listOrganizationsUseCase: ListOrganizationsUseCase,
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
}
EOF

cat > "$TARGET/list-organizations.test.ts" <<'EOF'
import assert from 'node:assert/strict';
import test from 'node:test';

import {
  membershipId,
  organizationId,
  userId,
  type OrganizationId,
} from '@synaptria/core';
import type {
  CreateOrganizationInput,
  Organization,
  OrganizationRepository,
  OrganizationSummary,
  UpdateOrganizationInput,
} from '@synaptria/domain/organization';

import { ListOrganizationsUseCase } from './list-organizations';

const USER_ID = userId('user-1');
const ALPHA_ID = organizationId('org-alpha');
const BETA_ID = organizationId('org-beta');
const GAMMA_ID = organizationId('org-gamma');
const NOW = new Date('2026-07-22T16:00:00.000Z');

class InMemoryOrganizationRepository implements OrganizationRepository {
  constructor(
    readonly summaries: readonly OrganizationSummary[],
  ) {}

  async listForUser(): Promise<readonly OrganizationSummary[]> {
    return this.summaries;
  }

  async create(_input: CreateOrganizationInput): Promise<Organization> {
    throw new Error('Not implemented in this test.');
  }

  async findById(): Promise<Organization | null> {
    return null;
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
}

test('lists accessible organizations alphabetically and marks the requested active organization', async () => {
  const repository = new InMemoryOrganizationRepository([
    summary(BETA_ID, 'Beta Bio', 'beta-bio'),
    summary(ALPHA_ID, 'Alpha Labs', 'alpha-labs'),
  ]);
  const useCase = new ListOrganizationsUseCase(repository);

  const output = await useCase.execute({
    userId: USER_ID,
    activeOrganizationId: BETA_ID,
  });

  assert.equal(output.activeOrganizationId, BETA_ID);
  assert.deepEqual(
    output.organizations.map((item) => item.organization.id),
    [ALPHA_ID, BETA_ID],
  );
  assert.deepEqual(
    output.organizations.map((item) => item.isActive),
    [false, true],
  );
});

test('falls back to the first accessible organization when the requested tenant is inaccessible', async () => {
  const repository = new InMemoryOrganizationRepository([
    summary(BETA_ID, 'Beta Bio', 'beta-bio'),
    summary(ALPHA_ID, 'Alpha Labs', 'alpha-labs'),
  ]);
  const useCase = new ListOrganizationsUseCase(repository);

  const output = await useCase.execute({
    userId: USER_ID,
    activeOrganizationId: organizationId('org-not-accessible'),
  });

  assert.equal(output.activeOrganizationId, ALPHA_ID);
  assert.equal(output.organizations[0]?.isActive, true);
});

test('returns an empty result when the user has no organizations', async () => {
  const useCase = new ListOrganizationsUseCase(
    new InMemoryOrganizationRepository([]),
  );

  const output = await useCase.execute({ userId: USER_ID });

  assert.deepEqual(output, { organizations: [] });
});

test('defensively excludes inactive memberships and deleted organizations', async () => {
  const deleted = summary(GAMMA_ID, 'Gamma Bio', 'gamma-bio', {
    deletedAt: NOW,
  });
  const suspended = summary(BETA_ID, 'Beta Bio', 'beta-bio', {
    membershipStatus: 'SUSPENDED',
  });
  const active = summary(ALPHA_ID, 'Alpha Labs', 'alpha-labs');
  const useCase = new ListOrganizationsUseCase(
    new InMemoryOrganizationRepository([deleted, suspended, active]),
  );

  const output = await useCase.execute({ userId: USER_ID });

  assert.equal(output.organizations.length, 1);
  assert.equal(output.organizations[0]?.organization.id, ALPHA_ID);
  assert.equal(output.activeOrganizationId, ALPHA_ID);
});

function summary(
  id: OrganizationId,
  name: string,
  slug: string,
  options: Readonly<{
    deletedAt?: Date;
    membershipStatus?: 'ACTIVE' | 'SUSPENDED';
  }> = {},
): OrganizationSummary {
  return {
    organization: {
      id,
      name,
      slug,
      defaultCurrency: 'USD',
      fiscalYearStartMonth: 1,
      timezone: 'UTC',
      countryCode: 'US',
      ...(options.deletedAt === undefined
        ? {}
        : { deletedAt: options.deletedAt }),
      createdAt: NOW,
      updatedAt: NOW,
    },
    membership: {
      id: membershipId(`membership-${id}`),
      organizationId: id,
      userId: USER_ID,
      role: 'OWNER',
      status: options.membershipStatus ?? 'ACTIVE',
      joinedAt: NOW,
      createdAt: NOW,
      updatedAt: NOW,
    },
  };
}
EOF

cat > "$TARGET/organization-service.test.ts" <<'EOF'
import assert from 'node:assert/strict';
import test from 'node:test';

import {
  correlationId,
  organizationId,
  requestId,
  userId,
} from '@synaptria/core';

import type {
  CreateOrganizationContext,
  CreateOrganizationInput,
  CreateOrganizationOutput,
} from './create-organization';
import type { CreateOrganizationUseCase } from './create-organization';
import type {
  ListOrganizationsContext,
  ListOrganizationsOutput,
} from './list-organizations';
import type { ListOrganizationsUseCase } from './list-organizations';
import { OrganizationService } from './organization-service';

const USER_ID = userId('user-1');

class CreateOrganizationStub {
  received?: Readonly<{
    context: CreateOrganizationContext;
    input: CreateOrganizationInput;
  }>;

  constructor(
    private readonly output: CreateOrganizationOutput,
  ) {}

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

  constructor(
    private readonly output: ListOrganizationsOutput,
  ) {}

  async execute(
    context: ListOrganizationsContext,
  ): Promise<ListOrganizationsOutput> {
    this.received = context;
    return this.output;
  }
}

test('organization service delegates to its focused use cases', async () => {
  const now = new Date('2026-07-22T16:00:00.000Z');
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
    organizations: [
      {
        ...createOutput,
        isActive: true,
      },
    ],
    activeOrganizationId: orgId,
  };
  const create = new CreateOrganizationStub(createOutput);
  const list = new ListOrganizationsStub(listOutput);
  const service = new OrganizationService(
    create as unknown as CreateOrganizationUseCase,
    list as unknown as ListOrganizationsUseCase,
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

  assert.equal(
    await service.createOrganization(createContext, createInput),
    createOutput,
  );
  assert.equal(await service.listOrganizations(listContext), listOutput);
  assert.deepEqual(create.received, {
    context: createContext,
    input: createInput,
  });
  assert.deepEqual(list.received, listContext);
});
EOF

cat > "$TARGET/index.ts" <<'EOF'
export * from './create-organization';
export * from './list-organizations';
export * from './organization-service';
export * from './organization-unit-of-work';

/** Public application-layer identifier for the Organization module. */
export const organizationModule = 'organization' as const;
EOF

echo "Phase 2B.2 files installed."
echo "Run the validation commands provided in ChatGPT."
