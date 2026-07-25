import type { Prisma, PrismaClient } from '@prisma/client';

import { PrismaAuditRepository } from './audit/prisma-audit-repository';
import { PrismaEventRepository } from './events/prisma-event-repository';
import { PrismaMembershipRepository } from './organization/prisma-membership-repository';
import { PrismaOrganizationRepository } from './organization/prisma-organization-repository';

import { PrismaProgramRepository } from './programs/prisma-program-repository';

export interface PersistenceRepositories {
  readonly audit: PrismaAuditRepository;
  readonly events: PrismaEventRepository;
  readonly memberships: PrismaMembershipRepository;
  readonly organizations: PrismaOrganizationRepository;
  readonly programs: PrismaProgramRepository;
}

export function createPersistenceRepositories(
  client: PrismaClient | Prisma.TransactionClient,
): PersistenceRepositories {
  return {
    audit: new PrismaAuditRepository(client),
    events: new PrismaEventRepository(client),
    memberships: new PrismaMembershipRepository(client),
    organizations: new PrismaOrganizationRepository(client),
    programs: new PrismaProgramRepository(client),
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
