import type { Prisma, PrismaClient } from '@prisma/client';

import { PrismaAuditRepository } from './audit/prisma-audit-repository';
import { PrismaEventRepository } from './events/prisma-event-repository';
import { PrismaMembershipRepository } from './organization/prisma-membership-repository';
import { PrismaOrganizationRepository } from './organization/prisma-organization-repository';

import { PrismaProgramRepository } from './programs/prisma-program-repository';
import { PrismaProjectRepository } from './projects/prisma-project-repository';
import { PrismaRecommendationReviewDecisionRepository } from './recommendation-reviews/prisma-recommendation-review-repository';
import { PrismaActionExecutionRequestRepository } from './action-executions/prisma-action-execution-request-repository';
import { PrismaMilestoneRepository } from './milestones/prisma-milestone-repository';
import { PrismaTaskRepository } from './tasks/prisma-task-repository';

export interface PersistenceRepositories {
  readonly audit: PrismaAuditRepository;
  readonly events: PrismaEventRepository;
  readonly memberships: PrismaMembershipRepository;
  readonly milestones: PrismaMilestoneRepository;
  readonly organizations: PrismaOrganizationRepository;
  readonly programs: PrismaProgramRepository;
  readonly projects: PrismaProjectRepository;
  readonly recommendationReviewDecisions: PrismaRecommendationReviewDecisionRepository;
  readonly actionExecutionRequests: PrismaActionExecutionRequestRepository;
  readonly tasks: PrismaTaskRepository;
}

/** Repositories required for action execution application transactions. */
export interface ActionExecutionPersistenceRepositories {
  readonly actionExecutionRequests: PrismaActionExecutionRequestRepository;
  readonly audit: PrismaAuditRepository;
  readonly events: PrismaEventRepository;
}

/** Repositories required for recommendation review application transactions. */
export interface RecommendationReviewPersistenceRepositories {
  readonly recommendationReviewDecisions: PrismaRecommendationReviewDecisionRepository;
  readonly audit: PrismaAuditRepository;
  readonly events: PrismaEventRepository;
}

/** Repositories required for milestone application transactions. */
export interface MilestonePersistenceRepositories {
  readonly milestones: PrismaMilestoneRepository;
  readonly projects: PrismaProjectRepository;
  readonly audit: PrismaAuditRepository;
  readonly events: PrismaEventRepository;
}

/** Repositories required for task application transactions. */
export interface TaskPersistenceRepositories {
  readonly tasks: PrismaTaskRepository;
  readonly milestones: PrismaMilestoneRepository;
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
    recommendationReviewDecisions: new PrismaRecommendationReviewDecisionRepository(client),
    actionExecutionRequests: new PrismaActionExecutionRequestRepository(client),
    tasks: new PrismaTaskRepository(client),
  };
}

export function selectActionExecutionPersistenceRepositories(
  repositories: PersistenceRepositories,
): ActionExecutionPersistenceRepositories {
  return {
    actionExecutionRequests: repositories.actionExecutionRequests,
    audit: repositories.audit,
    events: repositories.events,
  };
}

export async function withActionExecutionTransaction<T>(
  client: PrismaClient,
  operation: (repositories: ActionExecutionPersistenceRepositories) => Promise<T>,
): Promise<T> {
  return withDatabaseTransaction(client, (repositories) =>
    operation(selectActionExecutionPersistenceRepositories(repositories)),
  );
}

export function selectRecommendationReviewPersistenceRepositories(
  repositories: PersistenceRepositories,
): RecommendationReviewPersistenceRepositories {
  return {
    recommendationReviewDecisions: repositories.recommendationReviewDecisions,
    audit: repositories.audit,
    events: repositories.events,
  };
}

export async function withRecommendationReviewTransaction<T>(
  client: PrismaClient,
  operation: (repositories: RecommendationReviewPersistenceRepositories) => Promise<T>,
): Promise<T> {
  return withDatabaseTransaction(client, (repositories) =>
    operation(selectRecommendationReviewPersistenceRepositories(repositories)),
  );
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

export function selectTaskPersistenceRepositories(
  repositories: PersistenceRepositories,
): TaskPersistenceRepositories {
  return {
    tasks: repositories.tasks,
    milestones: repositories.milestones,
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

export async function withTaskTransaction<T>(
  client: PrismaClient,
  operation: (repositories: TaskPersistenceRepositories) => Promise<T>,
): Promise<T> {
  return withDatabaseTransaction(client, (repositories) =>
    operation(selectTaskPersistenceRepositories(repositories)),
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
