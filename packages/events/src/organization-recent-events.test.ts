import assert from 'node:assert/strict';
import test from 'node:test';

import { identifier, organizationId } from '@synaptria/core';

import { filterRecentOrganizationEvents } from './organization-recent-events';
import type { DomainEventEnvelope, DomainEventId } from './types';

const ORG_A = organizationId('org-a');
const ORG_B = organizationId('org-b');

function eventFixture(
  overrides: Partial<DomainEventEnvelope> & Pick<DomainEventEnvelope, 'id'>,
): DomainEventEnvelope {
  return {
    organizationId: ORG_A,
    eventType: 'project.created',
    eventVersion: 1,
    aggregateType: 'Project',
    aggregateId: 'project-1',
    payload: { name: 'Alpha' },
    status: 'PUBLISHED',
    occurredAt: new Date('2026-07-26T12:00:00.000Z'),
    availableAt: new Date('2026-07-26T12:00:00.000Z'),
    attempts: 0,
    ...overrides,
  };
}

test('filterRecentOrganizationEvents scopes results to the organization', () => {
  const events = [
    eventFixture({ id: identifier('event-a', 'DomainEventId') }),
    eventFixture({
      id: identifier('event-b', 'DomainEventId'),
      organizationId: ORG_B,
    }),
  ];

  const result = filterRecentOrganizationEvents(events, {
    organizationId: ORG_A,
    limit: 10,
  });

  assert.equal(result.length, 1);
  assert.equal(result[0]?.id, 'event-a');
});

test('filterRecentOrganizationEvents orders by occurredAt desc then id asc', () => {
  const sameTime = new Date('2026-07-26T12:00:00.000Z');
  const events = [
    eventFixture({
      id: identifier('event-z', 'DomainEventId'),
      occurredAt: sameTime,
    }),
    eventFixture({
      id: identifier('event-a', 'DomainEventId'),
      occurredAt: sameTime,
    }),
    eventFixture({
      id: identifier('event-m', 'DomainEventId'),
      occurredAt: new Date('2026-07-26T11:00:00.000Z'),
    }),
    eventFixture({
      id: identifier('event-new', 'DomainEventId'),
      occurredAt: new Date('2026-07-26T13:00:00.000Z'),
    }),
  ];

  const result = filterRecentOrganizationEvents(events, {
    organizationId: ORG_A,
    limit: 10,
  });

  assert.deepEqual(
    result.map((event) => event.id),
    ['event-new', 'event-a', 'event-z', 'event-m'],
  );
});

test('filterRecentOrganizationEvents enforces the limit', () => {
  const events = [
    eventFixture({
      id: identifier('event-1', 'DomainEventId'),
      occurredAt: new Date('2026-07-26T13:00:00.000Z'),
    }),
    eventFixture({
      id: identifier('event-2', 'DomainEventId'),
      occurredAt: new Date('2026-07-26T12:00:00.000Z'),
    }),
    eventFixture({
      id: identifier('event-3', 'DomainEventId'),
      occurredAt: new Date('2026-07-26T11:00:00.000Z'),
    }),
  ];

  const result = filterRecentOrganizationEvents(events, {
    organizationId: ORG_A,
    limit: 2,
  });

  assert.equal(result.length, 2);
  assert.deepEqual(
    result.map((event) => event.id),
    ['event-1', 'event-2'],
  );
});

test('filterRecentOrganizationEvents returns an empty array when no events match', () => {
  const result = filterRecentOrganizationEvents([], {
    organizationId: ORG_A,
    limit: 5,
  });

  assert.deepEqual(result, []);
});

test('filterRecentOrganizationEvents supports optional event-type filtering', () => {
  const events = [
    eventFixture({
      id: identifier('event-project', 'DomainEventId'),
      eventType: 'project.created',
    }),
    eventFixture({
      id: identifier('event-milestone', 'DomainEventId'),
      eventType: 'milestone.created',
      aggregateType: 'Milestone',
      aggregateId: 'milestone-1',
    }),
  ];

  const result = filterRecentOrganizationEvents(events, {
    organizationId: ORG_A,
    limit: 10,
    eventTypes: ['milestone.created'],
  });

  assert.equal(result.length, 1);
  assert.equal(result[0]?.id, 'event-milestone');
});

test('filterRecentOrganizationEvents supports optional aggregate-type filtering', () => {
  const events = [
    eventFixture({
      id: identifier('event-project', 'DomainEventId'),
      aggregateType: 'Project',
    }),
    eventFixture({
      id: identifier('event-task', 'DomainEventId'),
      eventType: 'task.created',
      aggregateType: 'Task',
      aggregateId: 'task-1',
    }),
  ];

  const result = filterRecentOrganizationEvents(events, {
    organizationId: ORG_A,
    limit: 10,
    aggregateTypes: ['Task'],
  });

  assert.equal(result.length, 1);
  assert.equal(result[0]?.id, 'event-task');
});

test('filterRecentOrganizationEvents supports occurredAtOnOrAfter filtering', () => {
  const cutoff = new Date('2026-07-25T12:00:00.000Z');
  const events = [
    eventFixture({
      id: identifier('event-before', 'DomainEventId'),
      occurredAt: new Date('2026-07-24T12:00:00.000Z'),
    }),
    eventFixture({
      id: identifier('event-at-cutoff', 'DomainEventId'),
      occurredAt: cutoff,
    }),
    eventFixture({
      id: identifier('event-after', 'DomainEventId'),
      occurredAt: new Date('2026-07-26T12:00:00.000Z'),
    }),
  ];

  const result = filterRecentOrganizationEvents(events, {
    organizationId: ORG_A,
    limit: 10,
    occurredAtOnOrAfter: cutoff,
  });

  assert.deepEqual(
    result.map((event) => event.id),
    ['event-after', 'event-at-cutoff'],
  );
});

test('filterRecentOrganizationEvents is deterministic across repeated reads', () => {
  const events = [
    eventFixture({
      id: identifier('event-1', 'DomainEventId') as DomainEventId,
      occurredAt: new Date('2026-07-26T12:00:00.000Z'),
    }),
    eventFixture({
      id: identifier('event-2', 'DomainEventId') as DomainEventId,
      occurredAt: new Date('2026-07-26T12:00:00.000Z'),
    }),
  ];

  const query = { organizationId: ORG_A, limit: 10 };
  const first = filterRecentOrganizationEvents(events, query);
  const second = filterRecentOrganizationEvents(events, query);

  assert.deepEqual(
    first.map((event) => event.id),
    second.map((event) => event.id),
  );
});
