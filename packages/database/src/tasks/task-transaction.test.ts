import assert from 'node:assert/strict';
import test from 'node:test';

import type { Prisma, PrismaClient } from '@prisma/client';

import {
  createPersistenceRepositories,
  withTaskTransaction,
} from '../transaction';

test('withTaskTransaction exposes task transaction repositories', async () => {
  const transactionClient = { kind: 'transaction' } as unknown as Prisma.TransactionClient;

  const client = {
    $transaction: async <T>(
      callback: (transaction: Prisma.TransactionClient) => Promise<T>,
    ): Promise<T> => callback(transactionClient),
  } as unknown as PrismaClient;

  await withTaskTransaction(client, (repositories) => {
    assert.ok(repositories.tasks);
    assert.ok(repositories.milestones);
    assert.ok(repositories.audit);
    assert.ok(repositories.events);
    return Promise.resolve(undefined);
  });
});

test('createPersistenceRepositories includes tasks', () => {
  const client = { task: {}, milestone: {} } as unknown as PrismaClient;
  const repositories = createPersistenceRepositories(client);

  assert.ok(repositories.tasks);
  assert.ok(repositories.milestones);
  assert.ok(repositories.audit);
  assert.ok(repositories.events);
});
