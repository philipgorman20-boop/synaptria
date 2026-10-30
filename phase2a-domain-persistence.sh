set -euo pipefail
mkdir -p packages/domain/src/organization
cat > packages/domain/package.json <<'JSON'
{
  "name": "@synaptria/domain",
  "version": "0.0.0",
  "private": true,
  "type": "module",
  "exports": {
    ".": "./src/index.ts",
    "./organization": "./src/organization/index.ts"
  },
  "scripts": {
    "build": "tsc --noEmit",
    "lint": "tsc --noEmit",
    "typecheck": "tsc --noEmit",
    "test": "node --import tsx --test src/**/*.test.ts"
  },
  "dependencies": {
    "@synaptria/core": "workspace:*"
  },
  "devDependencies": {
    "@types/node": "^22.20.1",
    "tsx": "^4.23.1",
    "typescript": "^5.8.3"
  }
}
JSON
cat > packages/domain/tsconfig.json <<'JSON'
{
  "extends": "../../tsconfig.base.json",
  "compilerOptions": {
    "noEmit": true,
    "types": ["node"]
  },
  "include": ["src/**/*.ts"]
}
JSON
cat > packages/domain/README.md <<'EOF2'
# @synaptria/domain

Framework-independent business models and repository contracts for Synaptria.

This package must not import Prisma, Next.js, Auth.js, or application-layer code.
EOF2
cat > packages/domain/src/index.ts <<'EOF2'
export * from './organization';
EOF2
cat > packages/domain/src/organization/models.ts <<'EOF2'
import type {
  MembershipId,
  OrganizationId,
  OrganizationRole,
  UserId,
} from '@synaptria/core';

export type MembershipStatus = 'INVITED' | 'ACTIVE' | 'SUSPENDED' | 'REMOVED';

export interface OrganizationSettings {
  readonly [key: string]: unknown;
}

export interface Organization {
  readonly id: OrganizationId;
  readonly name: string;
  readonly slug: string;
  readonly legalName?: string;
  readonly defaultCurrency: string;
  readonly fiscalYearStartMonth: number;
  readonly timezone: string;
  readonly countryCode: string;
  readonly settings?: OrganizationSettings;
  readonly deletedAt?: Date;
  readonly createdAt: Date;
  readonly updatedAt: Date;
}

export interface OrganizationMembership {
  readonly id: MembershipId;
  readonly organizationId: OrganizationId;
  readonly userId: UserId;
  readonly role: OrganizationRole;
  readonly status: MembershipStatus;
  readonly invitedAt?: Date;
  readonly joinedAt?: Date;
  readonly suspendedAt?: Date;
  readonly createdAt: Date;
  readonly updatedAt: Date;
}

export interface OrganizationSummary {
  readonly organization: Organization;
  readonly membership: OrganizationMembership;
}
EOF2
cat > packages/domain/src/organization/organization-repository.ts <<'EOF2'
import type { OrganizationId, UserId } from '@synaptria/core';

import type { Organization, OrganizationSettings, OrganizationSummary } from './models';

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

export interface UpdateOrganizationInput {
  readonly name?: string;
  readonly slug?: string;
  readonly legalName?: string | null;
  readonly defaultCurrency?: string;
  readonly fiscalYearStartMonth?: number;
  readonly timezone?: string;
  readonly countryCode?: string;
  readonly settings?: OrganizationSettings | null;
}

export interface OrganizationRepository {
  create(input: CreateOrganizationInput): Promise<Organization>;
  findById(id: OrganizationId): Promise<Organization | null>;
  findBySlug(slug: string): Promise<Organization | null>;
  update(id: OrganizationId, input: UpdateOrganizationInput): Promise<Organization>;
  softDelete(id: OrganizationId, deletedAt: Date): Promise<Organization>;
  listForUser(userId: UserId): Promise<readonly OrganizationSummary[]>;
}
EOF2
cat > packages/domain/src/organization/membership-repository.ts <<'EOF2'
import type {
  MembershipId,
  OrganizationId,
  OrganizationRole,
  UserId,
} from '@synaptria/core';

import type { MembershipStatus, OrganizationMembership } from './models';

export interface AddMembershipInput {
  readonly organizationId: OrganizationId;
  readonly userId: UserId;
  readonly role: OrganizationRole;
  readonly status?: MembershipStatus;
  readonly invitedAt?: Date;
  readonly joinedAt?: Date;
}

export interface MembershipRepository {
  add(input: AddMembershipInput): Promise<OrganizationMembership>;
  findById(id: MembershipId): Promise<OrganizationMembership | null>;
  findForUser(
    organizationId: OrganizationId,
    userId: UserId,
  ): Promise<OrganizationMembership | null>;
  listMembers(organizationId: OrganizationId): Promise<readonly OrganizationMembership[]>;
  listForUser(userId: UserId): Promise<readonly OrganizationMembership[]>;
  updateRole(id: MembershipId, role: OrganizationRole): Promise<OrganizationMembership>;
  updateStatus(
    id: MembershipId,
    status: MembershipStatus,
    changedAt: Date,
  ): Promise<OrganizationMembership>;
  isActiveMember(organizationId: OrganizationId, userId: UserId): Promise<boolean>;
}
EOF2
cat > packages/domain/src/organization/index.ts <<'EOF2'
export * from './membership-repository';
export * from './models';
export * from './organization-repository';
EOF2

python3 - <<'PY'
import json
p='packages/database/package.json'
data=json.load(open(p))
data['dependencies']['@synaptria/domain']='workspace:*'
open(p,'w').write(json.dumps(data,indent=2)+'\n')
PY
mkdir -p packages/database/src/organization
cat > packages/database/src/organization/prisma-organization-repository.ts <<'EOF2'
import type { Organization as PrismaOrganization, Prisma, PrismaClient } from '@prisma/client';
import { identifier, type OrganizationId, type UserId } from '@synaptria/core';
import type {
  CreateOrganizationInput,
  Organization,
  OrganizationRepository,
  OrganizationSettings,
  OrganizationSummary,
  UpdateOrganizationInput,
} from '@synaptria/domain/organization';

import { toPrismaJson } from '../json';
import { mapMembership } from './prisma-membership-repository';

export type OrganizationDatabaseClient = Pick<PrismaClient, 'organization' | 'membership'>;

export class PrismaOrganizationRepository implements OrganizationRepository {
  constructor(private readonly client: OrganizationDatabaseClient) {}

  async create(input: CreateOrganizationInput): Promise<Organization> {
    const data: Prisma.OrganizationCreateInput = {
      name: input.name,
      slug: input.slug,
      ...(input.legalName === undefined ? {} : { legalName: input.legalName }),
      ...(input.defaultCurrency === undefined
        ? {}
        : { defaultCurrency: input.defaultCurrency }),
      ...(input.fiscalYearStartMonth === undefined
        ? {}
        : { fiscalYearStartMonth: input.fiscalYearStartMonth }),
      ...(input.timezone === undefined ? {} : { timezone: input.timezone }),
      ...(input.countryCode === undefined ? {} : { countryCode: input.countryCode }),
      ...(input.settings === undefined ? {} : { settings: toPrismaJson(input.settings) }),
    };

    return mapOrganization(await this.client.organization.create({ data }));
  }

  async findById(id: OrganizationId): Promise<Organization | null> {
    const row = await this.client.organization.findFirst({
      where: { id, deletedAt: null },
    });
    return row === null ? null : mapOrganization(row);
  }

  async findBySlug(slug: string): Promise<Organization | null> {
    const row = await this.client.organization.findFirst({
      where: { slug, deletedAt: null },
    });
    return row === null ? null : mapOrganization(row);
  }

  async update(id: OrganizationId, input: UpdateOrganizationInput): Promise<Organization> {
    const data: Prisma.OrganizationUpdateInput = {
      ...(input.name === undefined ? {} : { name: input.name }),
      ...(input.slug === undefined ? {} : { slug: input.slug }),
      ...(input.legalName === undefined ? {} : { legalName: input.legalName }),
      ...(input.defaultCurrency === undefined
        ? {}
        : { defaultCurrency: input.defaultCurrency }),
      ...(input.fiscalYearStartMonth === undefined
        ? {}
        : { fiscalYearStartMonth: input.fiscalYearStartMonth }),
      ...(input.timezone === undefined ? {} : { timezone: input.timezone }),
      ...(input.countryCode === undefined ? {} : { countryCode: input.countryCode }),
      ...(input.settings === undefined
        ? {}
        : { settings: input.settings === null ? Prisma.JsonNull : toPrismaJson(input.settings) }),
    };

    return mapOrganization(
      await this.client.organization.update({ where: { id }, data }),
    );
  }

  async softDelete(id: OrganizationId, deletedAt: Date): Promise<Organization> {
    return mapOrganization(
      await this.client.organization.update({
        where: { id },
        data: { deletedAt },
      }),
    );
  }

  async listForUser(userId: UserId): Promise<readonly OrganizationSummary[]> {
    const rows = await this.client.membership.findMany({
      where: {
        userId,
        status: 'ACTIVE',
        organization: { deletedAt: null },
      },
      include: { organization: true },
      orderBy: { createdAt: 'asc' },
    });

    return rows.map((row) => ({
      organization: mapOrganization(row.organization),
      membership: mapMembership(row),
    }));
  }
}

export function mapOrganization(row: PrismaOrganization): Organization {
  const settings = isRecord(row.settings)
    ? (row.settings as OrganizationSettings)
    : undefined;

  return {
    id: identifier(row.id, 'OrganizationId') as OrganizationId,
    name: row.name,
    slug: row.slug,
    ...(row.legalName === null ? {} : { legalName: row.legalName }),
    defaultCurrency: row.defaultCurrency,
    fiscalYearStartMonth: row.fiscalYearStartMonth,
    timezone: row.timezone,
    countryCode: row.countryCode,
    ...(settings === undefined ? {} : { settings }),
    ...(row.deletedAt === null ? {} : { deletedAt: row.deletedAt }),
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}
EOF2
cat > packages/database/src/organization/prisma-membership-repository.ts <<'EOF2'
import type { Membership as PrismaMembership, Prisma, PrismaClient } from '@prisma/client';
import {
  identifier,
  type MembershipId,
  type OrganizationId,
  type OrganizationRole,
  type UserId,
} from '@synaptria/core';
import type {
  AddMembershipInput,
  MembershipRepository,
  MembershipStatus,
  OrganizationMembership,
} from '@synaptria/domain/organization';

export type MembershipDatabaseClient = Pick<PrismaClient, 'membership'>;

export class PrismaMembershipRepository implements MembershipRepository {
  constructor(private readonly client: MembershipDatabaseClient) {}

  async add(input: AddMembershipInput): Promise<OrganizationMembership> {
    const data: Prisma.MembershipUncheckedCreateInput = {
      organizationId: input.organizationId,
      userId: input.userId,
      role: input.role,
      status: input.status ?? 'ACTIVE',
      ...(input.invitedAt === undefined ? {} : { invitedAt: input.invitedAt }),
      ...(input.joinedAt === undefined ? {} : { joinedAt: input.joinedAt }),
    };

    return mapMembership(await this.client.membership.create({ data }));
  }

  async findById(id: MembershipId): Promise<OrganizationMembership | null> {
    const row = await this.client.membership.findUnique({ where: { id } });
    return row === null ? null : mapMembership(row);
  }

  async findForUser(
    organizationId: OrganizationId,
    userId: UserId,
  ): Promise<OrganizationMembership | null> {
    const row = await this.client.membership.findUnique({
      where: { organizationId_userId: { organizationId, userId } },
    });
    return row === null ? null : mapMembership(row);
  }

  async listMembers(
    organizationId: OrganizationId,
  ): Promise<readonly OrganizationMembership[]> {
    const rows = await this.client.membership.findMany({
      where: { organizationId },
      orderBy: { createdAt: 'asc' },
    });
    return rows.map(mapMembership);
  }

  async listForUser(userId: UserId): Promise<readonly OrganizationMembership[]> {
    const rows = await this.client.membership.findMany({
      where: { userId },
      orderBy: { createdAt: 'asc' },
    });
    return rows.map(mapMembership);
  }

  async updateRole(
    id: MembershipId,
    role: OrganizationRole,
  ): Promise<OrganizationMembership> {
    return mapMembership(
      await this.client.membership.update({ where: { id }, data: { role } }),
    );
  }

  async updateStatus(
    id: MembershipId,
    status: MembershipStatus,
    changedAt: Date,
  ): Promise<OrganizationMembership> {
    const data: Prisma.MembershipUpdateInput = {
      status,
      ...(status === 'ACTIVE' ? { joinedAt: changedAt, suspendedAt: null } : {}),
      ...(status === 'SUSPENDED' ? { suspendedAt: changedAt } : {}),
      ...(status === 'REMOVED' ? { suspendedAt: null } : {}),
    };

    return mapMembership(
      await this.client.membership.update({ where: { id }, data }),
    );
  }

  async isActiveMember(organizationId: OrganizationId, userId: UserId): Promise<boolean> {
    const count = await this.client.membership.count({
      where: { organizationId, userId, status: 'ACTIVE' },
    });
    return count > 0;
  }
}

export function mapMembership(row: PrismaMembership): OrganizationMembership {
  return {
    id: identifier(row.id, 'MembershipId') as MembershipId,
    organizationId: identifier(row.organizationId, 'OrganizationId') as OrganizationId,
    userId: identifier(row.userId, 'UserId') as UserId,
    role: row.role,
    status: row.status,
    ...(row.invitedAt === null ? {} : { invitedAt: row.invitedAt }),
    ...(row.joinedAt === null ? {} : { joinedAt: row.joinedAt }),
    ...(row.suspendedAt === null ? {} : { suspendedAt: row.suspendedAt }),
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
}
EOF2
cat > packages/database/src/organization/index.ts <<'EOF2'
export {
  mapMembership,
  PrismaMembershipRepository,
} from './prisma-membership-repository';
export type { MembershipDatabaseClient } from './prisma-membership-repository';
export {
  mapOrganization,
  PrismaOrganizationRepository,
} from './prisma-organization-repository';
export type { OrganizationDatabaseClient } from './prisma-organization-repository';
EOF2
python3 - <<'PY'
p='packages/database/src/index.ts'
s=open(p).read()
insert="export * from './organization';\n"
if insert not in s:
    s=s.replace("export { createPersistenceRepositories, withDatabaseTransaction } from './transaction';\n", "export { createPersistenceRepositories, withDatabaseTransaction } from './transaction';\n"+insert)
open(p,'w').write(s)
PY
cat > packages/database/src/transaction.ts <<'EOF2'
import type { Prisma, PrismaClient } from '@prisma/client';

import { PrismaAuditRepository } from './audit/prisma-audit-repository';
import { PrismaEventRepository } from './events/prisma-event-repository';
import { PrismaMembershipRepository } from './organization/prisma-membership-repository';
import { PrismaOrganizationRepository } from './organization/prisma-organization-repository';

export interface PersistenceRepositories {
  readonly audit: PrismaAuditRepository;
  readonly events: PrismaEventRepository;
  readonly memberships: PrismaMembershipRepository;
  readonly organizations: PrismaOrganizationRepository;
}

export function createPersistenceRepositories(
  client: PrismaClient | Prisma.TransactionClient,
): PersistenceRepositories {
  return {
    audit: new PrismaAuditRepository(client),
    events: new PrismaEventRepository(client),
    memberships: new PrismaMembershipRepository(client),
    organizations: new PrismaOrganizationRepository(client),
  };
}

export async function withDatabaseTransaction<T>(
  client: PrismaClient,
  operation: (
    repositories: PersistenceRepositories,
    transaction: Prisma.TransactionClient,
  ) => Promise<T>,
): Promise<T> {
  return client.$transaction(async (transaction) =>
    operation(createPersistenceRepositories(transaction), transaction),
  );
}
EOF2
cat > docs/01-architecture/domain-layer.md <<'EOF2'
# Domain Layer

`@synaptria/domain` owns framework-independent business models and repository contracts.

The domain package may depend on `@synaptria/core`, but it must not depend on Prisma,
Next.js, Auth.js, the application layer, or infrastructure packages.

The application layer orchestrates use cases against domain contracts. Persistence
adapters in `@synaptria/database` implement those contracts using Prisma.
EOF2
