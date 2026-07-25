import { PrismaClient } from '@prisma/client';

export { PrismaAuditRepository } from './audit/prisma-audit-repository';
export type { AuditDatabaseClient } from './audit/prisma-audit-repository';
export { PrismaEventRepository } from './events/prisma-event-repository';
export type { EventDatabaseClient } from './events/prisma-event-repository';
export { createPersistenceRepositories, withDatabaseTransaction } from './transaction';
export * from './organization';
export type { PersistenceRepositories } from './transaction';

const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

export const db =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['warn', 'error'] : ['error'],
  });

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = db;
}
