import assert from 'node:assert/strict';
import test from 'node:test';

import type { Prisma, PrismaClient } from '@prisma/client';

import {
  createPersistenceRepositories,
  withDatabaseTransaction,
  withMilestoneTransaction,
} from '../transaction';

test('withDatabaseTransaction passes the same transaction client to all repositories', async () => {
  const transactionClient = { kind: 'transaction' } as unknown as Prisma.TransactionClient;
  let capturedTransaction: Prisma.TransactionClient | undefined;

  const client = {
    $transaction: async <T>(
      callback: (transaction: Prisma.TransactionClient) => Promise<T>,
    ): Promise<T> => {
      capturedTransaction = transactionClient;
      return callback(transactionClient);
    },
  } as unknown as PrismaClient;

  await withDatabaseTransaction(client, (repositories, transaction) => {
    assert.equal(transaction, transactionClient);
    assert.ok(repositories.milestones);
    assert.ok(repositories.projects);
    assert.ok(repositories.audit);
    assert.ok(repositories.events);
    return Promise.resolve('ok');
  });

  assert.equal(capturedTransaction, transactionClient);
});

test('withMilestoneTransaction exposes milestone transaction repositories', async () => {
  const transactionClient = { kind: 'transaction' } as unknown as Prisma.TransactionClient;

  const client = {
    $transaction: async <T>(
      callback: (transaction: Prisma.TransactionClient) => Promise<T>,
    ): Promise<T> => callback(transactionClient),
  } as unknown as PrismaClient;

  await withMilestoneTransaction(client, (repositories) => {
    assert.ok(repositories.milestones);
    assert.ok(repositories.projects);
    assert.ok(repositories.audit);
    assert.ok(repositories.events);
    return Promise.resolve(undefined);
  });
});

test('withDatabaseTransaction propagates callback failures to roll back the transaction', async () => {
  let transactionStarted = false;

  const client = {
    $transaction: async <T>(
      callback: (transaction: Prisma.TransactionClient) => Promise<T>,
    ): Promise<T> => {
      transactionStarted = true;
      return callback({} as Prisma.TransactionClient);
    },
  } as unknown as PrismaClient;

  await assert.rejects(
    withDatabaseTransaction(client, async () => {
      throw new Error('boom');
    }),
    /boom/,
  );

  assert.equal(transactionStarted, true);
});

test('createPersistenceRepositories includes milestones', () => {
  const client = { milestone: {}, project: {} } as unknown as PrismaClient;
  const repositories = createPersistenceRepositories(client);

  assert.ok(repositories.milestones);
  assert.ok(repositories.projects);
  assert.ok(repositories.audit);
  assert.ok(repositories.events);
});
