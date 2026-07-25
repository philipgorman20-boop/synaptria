import assert from 'node:assert/strict';
import test from 'node:test';

import { identifier } from '@synaptria/core';

import { PrismaAuditRepository } from './prisma-audit-repository';

test('PrismaAuditRepository maps an audit event to and from Prisma', async () => {
  let captured: unknown;
  const occurredAt = new Date('2026-07-22T12:00:00.000Z');
  const client = {
    auditEvent: {
      create: async (args: { data: Record<string, unknown> }) => {
        captured = args.data;
        return {
          id: 'audit-1',
          organizationId: 'org-1',
          userId: 'user-1',
          actorType: 'USER' as const,
          actorId: 'user-1',
          action: 'CREATE' as const,
          entityType: 'Organization',
          entityId: 'org-1',
          requestId: 'request-1',
          correlationId: 'correlation-1',
          ipAddress: null,
          userAgent: null,
          before: null,
          after: { name: 'Synaptria' },
          metadata: null,
          occurredAt,
          programId: null,
        };
      },
    },
  };

  const repository = new PrismaAuditRepository(client as never);
  const record = await repository.create({
    organizationId: identifier('org-1', 'OrganizationId'),
    actor: {
      type: 'USER',
      id: 'user-1',
      userId: identifier('user-1', 'UserId'),
    },
    action: 'CREATE',
    target: { entityType: 'Organization', entityId: 'org-1' },
    request: {
      requestId: identifier('request-1', 'RequestId'),
      correlationId: identifier('correlation-1', 'CorrelationId'),
    },
    after: { name: 'Synaptria' },
    occurredAt,
  });

  assert.equal((captured as { organizationId: string }).organizationId, 'org-1');
  assert.equal(record.id, 'audit-1');
  assert.equal(record.target.entityType, 'Organization');
  assert.deepEqual(record.after, { name: 'Synaptria' });
});
