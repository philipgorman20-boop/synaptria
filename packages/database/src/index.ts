import { PrismaClient } from '@prisma/client';

export { PrismaAuditRepository } from './audit/prisma-audit-repository';
export type { AuditDatabaseClient } from './audit/prisma-audit-repository';
export { PrismaEventRepository } from './events/prisma-event-repository';
export type { EventDatabaseClient } from './events/prisma-event-repository';
export {
  createPersistenceRepositories,
  selectActionExecutionPersistenceRepositories,
  selectMilestonePersistenceRepositories,
  selectRecommendationReviewPersistenceRepositories,
  selectTaskPersistenceRepositories,
  withActionExecutionTransaction,
  withDatabaseTransaction,
  withMilestoneTransaction,
  withRecommendationReviewTransaction,
  withTaskTransaction,
} from './transaction';
export type {
  ActionExecutionPersistenceRepositories,
  MilestonePersistenceRepositories,
  PersistenceRepositories,
  RecommendationReviewPersistenceRepositories,
  TaskPersistenceRepositories,
} from './transaction';
export * from './milestones';
export * from './tasks';
export * from './organization';
export * from './programs';
export * from './projects';
export * from './recommendation-reviews';
export * from './action-executions';
export * from './risks';
export * from './decisions';
export * from './vendors';
export * from './documents';
export * from './budgets';

const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

export const db =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['warn', 'error'] : ['error'],
  });

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = db;
}
