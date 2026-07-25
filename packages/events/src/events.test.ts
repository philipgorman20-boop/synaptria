import assert from 'node:assert/strict';
import test from 'node:test';

import {
  FixedClock,
  correlationId,
  membershipId,
  organizationId,
  requestId,
  userId,
  type IdGenerator,
  type RequestContext,
} from '@synaptria/core';

import {
  DomainEventService,
  DuplicateEventError,
  InMemoryEventIdempotencyStore,
  toEventJson,
  type AggregateEventQuery,
  type DomainEventEnvelope,
  type DomainEventId,
  type DomainEventStatus,
  type EventRepository,
} from './index';

class SequenceIdGenerator implements IdGenerator {
  private value = 0;
  generate(): string {
    this.value += 1;
    return `event-${this.value}`;
  }
}

class MemoryEventRepository implements EventRepository {
  readonly events: DomainEventEnvelope[] = [];

  async append(event: DomainEventEnvelope): Promise<DomainEventEnvelope> {
    this.events.push(event);
    return event;
  }

  async appendMany(events: readonly DomainEventEnvelope[]): Promise<readonly DomainEventEnvelope[]> {
    this.events.push(...events);
    return events;
  }

  async findById(id: DomainEventId): Promise<DomainEventEnvelope | null> {
    return this.events.find((event) => event.id === id) ?? null;
  }

  async findByAggregate(query: AggregateEventQuery): Promise<readonly DomainEventEnvelope[]> {
    return this.events.filter(
      (event) =>
        event.organizationId === query.organizationId &&
        event.aggregateType === query.aggregateType &&
        event.aggregateId === query.aggregateId,
    );
  }

  async updateStatus(
    id: DomainEventId,
    status: DomainEventStatus,
  ): Promise<DomainEventEnvelope> {
    const event = await this.findById(id);
    if (event === null) throw new Error('not found');
    return { ...event, status };
  }
}

const context: RequestContext = {
  organizationId: organizationId('org-1'),
  membershipId: membershipId('membership-1'),
  userId: userId('user-1'),
  role: 'OWNER',
  requestId: requestId('request-1'),
  correlationId: correlationId('correlation-1'),
};

test('publish creates a tenant-aware event envelope', async () => {
  const repository = new MemoryEventRepository();
  const instant = new Date('2026-07-22T12:00:00.000Z');
  const service = new DomainEventService(
    repository,
    new FixedClock(instant),
    new SequenceIdGenerator(),
  );

  const event = await service.publish({
    context,
    event: {
      type: 'program.created',
      aggregateType: 'Program',
      aggregateId: 'program-1',
      payload: { name: 'Oncology Program' },
    },
  });

  assert.equal(event.id, 'event-1');
  assert.equal(event.organizationId, context.organizationId);
  assert.equal(event.actorId, context.userId);
  assert.equal(event.requestId, context.requestId);
  assert.equal(event.correlationId, context.correlationId);
  assert.equal(event.status, 'PENDING');
  assert.equal(event.occurredAt.toISOString(), instant.toISOString());
});

test('serialization redacts secrets and handles circular values', () => {
  const payload: Record<string, unknown> = { password: 'unsafe', nested: { token: 'unsafe' } };
  payload.self = payload;

  assert.deepEqual(toEventJson(payload), {
    password: '[REDACTED]',
    nested: { token: '[REDACTED]' },
    self: '[CIRCULAR]',
  });
});

test('idempotency rejects a duplicate event', async () => {
  const repository = new MemoryEventRepository();
  const service = new DomainEventService(
    repository,
    new FixedClock(new Date('2026-07-22T12:00:00.000Z')),
    new SequenceIdGenerator(),
    new InMemoryEventIdempotencyStore(),
  );

  const input = {
    context,
    event: {
      type: 'budget.approved',
      aggregateType: 'Budget',
      aggregateId: 'budget-1',
      idempotencyKey: 'approve-budget-1',
      payload: { approved: true },
    },
  } as const;

  await service.publish(input);
  await assert.rejects(() => service.publish(input), DuplicateEventError);
  assert.equal(repository.events.length, 1);
});

test('publish validates required event fields', async () => {
  const service = new DomainEventService(
    new MemoryEventRepository(),
    new FixedClock(new Date('2026-07-22T12:00:00.000Z')),
    new SequenceIdGenerator(),
  );

  await assert.rejects(
    () =>
      service.publish({
        context,
        event: {
          type: '   ',
          aggregateType: 'Program',
          aggregateId: 'program-1',
          payload: {},
        },
      }),
    /event type cannot be empty/,
  );
});
