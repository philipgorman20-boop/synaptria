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

test('PrismaEventRepository lists recent organization events with deterministic ordering', async () => {
  const orgA = 'org-a';
  const orgB = 'org-b';
  const sameTime = new Date('2026-07-26T12:00:00.000Z');
  const rows = [
    {
      id: 'event-z',
      organizationId: orgA,
      aggregateType: 'Project',
      aggregateId: 'project-1',
      eventType: 'project.updated',
      eventVersion: 1,
      payload: {},
      metadata: {
        __synaptriaEvent: { occurredAt: sameTime.toISOString() },
      },
      status: 'PUBLISHED',
      correlationId: null,
      causationId: null,
      availableAt: sameTime,
      publishedAt: null,
      attempts: 0,
      lastError: null,
      createdAt: sameTime,
      updatedAt: sameTime,
    },
    {
      id: 'event-a',
      organizationId: orgA,
      aggregateType: 'Project',
      aggregateId: 'project-1',
      eventType: 'project.created',
      eventVersion: 1,
      payload: {},
      metadata: {
        __synaptriaEvent: { occurredAt: sameTime.toISOString() },
      },
      status: 'PUBLISHED',
      correlationId: null,
      causationId: null,
      availableAt: sameTime,
      publishedAt: null,
      attempts: 0,
      lastError: null,
      createdAt: sameTime,
      updatedAt: sameTime,
    },
    {
      id: 'event-other-org',
      organizationId: orgB,
      aggregateType: 'Project',
      aggregateId: 'project-2',
      eventType: 'project.created',
      eventVersion: 1,
      payload: {},
      metadata: {
        __synaptriaEvent: { occurredAt: sameTime.toISOString() },
      },
      status: 'PUBLISHED',
      correlationId: null,
      causationId: null,
      availableAt: sameTime,
      publishedAt: null,
      attempts: 0,
      lastError: null,
      createdAt: sameTime,
      updatedAt: sameTime,
    },
  ];

  let capturedQuery: Record<string, unknown> | undefined;
  const client = {
    domainEvent: {
      create: async () => {
        throw new Error('not used');
      },
      findUnique: async () => null,
      findMany: async (args: Record<string, unknown>) => {
        capturedQuery = args;
        const where = args.where as { organizationId?: string; eventType?: { in: string[] } };
        return rows
          .filter((row) => row.organizationId === where.organizationId)
          .filter((row) =>
            where.eventType === undefined ? true : where.eventType.in.includes(row.eventType),
          )
          .sort((left, right) => {
            const byCreatedAt = right.createdAt.getTime() - left.createdAt.getTime();
            if (byCreatedAt !== 0) {
              return byCreatedAt;
            }
            return left.id.localeCompare(right.id, 'en', { sensitivity: 'base' });
          })
          .slice(0, args.take as number);
      },
      update: async () => {
        throw new Error('not used');
      },
    },
  };

  const repository = new PrismaEventRepository(client as never);
  const result = await repository.listRecentForOrganization({
    organizationId: identifier(orgA, 'OrganizationId'),
    limit: 2,
    eventTypes: ['project.created', 'project.updated'],
  });

  assert.deepEqual(
    result.map((event) => event.id),
    ['event-a', 'event-z'],
  );
  assert.deepEqual(capturedQuery?.orderBy, [{ createdAt: 'desc' }, { id: 'asc' }]);
  assert.equal(capturedQuery?.take, 2);
});

test('PrismaEventRepository applies occurredAtOnOrAfter as createdAt gte filter', async () => {
  const orgA = 'org-a';
  const cutoff = new Date('2026-07-25T12:00:00.000Z');

  let capturedQuery: Record<string, unknown> | undefined;
  const client = {
    domainEvent: {
      create: async () => {
        throw new Error('not used');
      },
      findUnique: async () => null,
      findMany: async (args: Record<string, unknown>) => {
        capturedQuery = args;
        return [];
      },
      update: async () => {
        throw new Error('not used');
      },
    },
  };

  const repository = new PrismaEventRepository(client as never);
  await repository.listRecentForOrganization({
    organizationId: identifier(orgA, 'OrganizationId'),
    limit: 10,
    occurredAtOnOrAfter: cutoff,
  });

  assert.deepEqual(
    (capturedQuery?.where as { createdAt?: { gte: Date } })?.createdAt,
    { gte: cutoff },
  );
});
