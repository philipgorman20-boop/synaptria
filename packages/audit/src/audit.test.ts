import assert from 'node:assert/strict';
import test from 'node:test';

import {
  FixedClock,
  correlationId,
  membershipId,
  organizationId,
  requestId,
  userId,
} from '@synaptria/core';

import type { AuditRepository } from './repository';
import { toAuditJson } from './serialization';
import { AuditService } from './service';
import type { AuditEventRecord, RecordAuditEventInput } from './types';

class InMemoryAuditRepository implements AuditRepository {
  readonly events: RecordAuditEventInput[] = [];

  async create(input: RecordAuditEventInput): Promise<AuditEventRecord> {
    this.events.push(input);
    return { ...input, id: `audit-${this.events.length}`, occurredAt: input.occurredAt ?? new Date(0) };
  }
}

test('recordUserEvent derives tenant, actor, and request identity from context', async () => {
  const repository = new InMemoryAuditRepository();
  const instant = new Date('2026-07-22T12:00:00.000Z');
  const service = new AuditService(repository, new FixedClock(instant));

  const event = await service.recordUserEvent({
    context: {
      userId: userId('user-1'),
      organizationId: organizationId('org-1'),
      membershipId: membershipId('membership-1'),
      role: 'ADMIN',
      requestId: requestId('request-1'),
      correlationId: correlationId('correlation-1'),
    },
    action: 'UPDATE',
    target: { entityType: 'Program', entityId: 'program-1' },
    after: { name: 'Oncology Program' },
  });

  assert.equal(event.organizationId, 'org-1');
  assert.equal(event.actor.type, 'USER');
  assert.equal(event.actor.userId, 'user-1');
  assert.equal(event.request?.requestId, 'request-1');
  assert.equal(event.request?.correlationId, 'correlation-1');
  assert.equal(event.occurredAt.toISOString(), instant.toISOString());
});

test('serialization redacts credentials and handles circular values', () => {
  const value: Record<string, unknown> = {
    accessToken: 'secret-token',
    nested: { api_key: 'secret-key' },
  };
  value.self = value;

  assert.deepEqual(toAuditJson(value), {
    accessToken: '[REDACTED]',
    nested: { api_key: '[REDACTED]' },
    self: '[CIRCULAR]',
  });
});

test('record rejects an empty entity type', async () => {
  const service = new AuditService(new InMemoryAuditRepository());

  await assert.rejects(
    service.record({
      organizationId: organizationId('org-1'),
      actor: { type: 'SYSTEM', id: 'system' },
      action: 'CUSTOM',
      target: { entityType: '   ' },
    }),
    /entityType cannot be empty/,
  );
});
