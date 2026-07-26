import type { Prisma, PrismaClient } from '@prisma/client';

import { PrismaAuditRepository } from './audit/prisma-audit-repository';
import { PrismaEventRepository } from './events/prisma-event-repository';
import { PrismaMembershipRepository } from './organization/prisma-membership-repository';
import { PrismaOrganizationRepository } from './organization/prisma-organization-repository';

import { PrismaProgramRepository } from './programs/prisma-program-repository';
import { PrismaProjectRepository } from './projects/prisma-project-repository';
import { PrismaMilestoneRepository } from './milestones/prisma-milestone-repository';

export interface PersistenceRepositories {
  readonly audit: PrismaAuditRepository;
  readonly events: PrismaEventRepository;
  readonly memberships: PrismaMembershipRepository;
  readonly milestones: PrismaMilestoneRepository;
  readonly organizations: PrismaOrganizationRepository;
  readonly programs: PrismaProgramRepository;
  readonly projects: PrismaProjectRepository;
}

/** Repositories required for milestone application transactions. */
export interface MilestonePersistenceRepositories {
  readonly milestones: PrismaMilestoneRepository;
  readonly projects: PrismaProjectRepository;
  readonly audit: PrismaAuditRepository;
  readonly events: PrismaEventRepository;
}

export function createPersistenceRepositories(
  client: PrismaClient | Prisma.TransactionClient,
): PersistenceRepositories {
  return {
    audit: new PrismaAuditRepository(client),
    events: new PrismaEventRepository(client),
    memberships: new PrismaMembershipRepository(client),
    milestones: new PrismaMilestoneRepository(client),
    organizations: new PrismaOrganizationRepository(client),
    programs: new PrismaProgramRepository(client),
    projects: new PrismaProjectRepository(client),
  };
}

export function selectMilestonePersistenceRepositories(
  repositories: PersistenceRepositories,
): MilestonePersistenceRepositories {
  return {
    milestones: repositories.milestones,
    projects: repositories.projects,
    audit: repositories.audit,
    events: repositories.events,
  };
}

export async function withMilestoneTransaction<T>(
  client: PrismaClient,
  operation: (repositories: MilestonePersistenceRepositories) => Promise<T>,
): Promise<T> {
  return withDatabaseTransaction(client, (repositories) =>
    operation(selectMilestonePersistenceRepositories(repositories)),
  );
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
