import assert from 'node:assert/strict';
import test from 'node:test';

import { identifier } from '@synaptria/core';

import { PrismaEventRepository } from './prisma-event-repository';

test('PrismaEventRepository preserves event envelope context in metadata', async () => {
  let captured: Record<string, unknown> | undefined;
  const occurredAt = new Date('2026-07-22T12:00:00.000Z');
  const client = {
    domainEvent: {
      create: async (args: { data: Record<string, unknown> }) => {
        captured = args.data;
        return {
          ...args.data,
          id: 'event-1',
          metadata: args.data.metadata,
          correlationId: 'correlation-1',
          causationId: null,
          publishedAt: null,
          lastError: null,
          createdAt: occurredAt,
          updatedAt: occurredAt,
        };
      },
      findUnique: async () => null,
      findMany: async () => [],
      update: async () => {
        throw new Error('not used');
      },
    },
  };

  const repository = new PrismaEventRepository(client as never);
  const result = await repository.append({
    id: identifier('event-1', 'DomainEventId'),
    organizationId: identifier('org-1', 'OrganizationId'),
    eventType: 'organization.created',
    eventVersion: 1,
    aggregateType: 'Organization',
    aggregateId: 'org-1',
    payload: { name: 'Synaptria' },
    metadata: { source: 'test' },
    status: 'PENDING',
    actorId: identifier('user-1', 'UserId'),
    requestId: identifier('request-1', 'RequestId'),
    correlationId: identifier('correlation-1', 'CorrelationId'),
    idempotencyKey: 'organization:create:org-1',
    occurredAt,
    availableAt: occurredAt,
    attempts: 0,
  });

  assert.equal(captured?.organizationId, 'org-1');
  assert.equal(result.actorId, 'user-1');
  assert.equal(result.requestId, 'request-1');
  assert.equal(result.idempotencyKey, 'organization:create:org-1');
  assert.deepEqual(result.metadata, { source: 'test' });
  assert.equal(result.occurredAt.toISOString(), occurredAt.toISOString());
});
