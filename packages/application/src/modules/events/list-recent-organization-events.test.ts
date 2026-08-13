import assert from 'node:assert/strict';
import test from 'node:test';

import { identifier, organizationId } from '@synaptria/core';
import { filterRecentOrganizationEvents } from '@synaptria/events';
import type { DomainEventEnvelope, DomainEventId, EventRepository } from '@synaptria/events';

import { ApplicationError } from '../../shared/application-error';
import { ListRecentOrganizationEventsUseCase } from './list-recent-organization-events';

const ORG_A = organizationId('org-a');
const ORG_B = organizationId('org-b');

class InMemoryEventRepository implements EventRepository {
  constructor(private readonly events: readonly DomainEventEnvelope[] = []) {}

  async append(event: DomainEventEnvelope): Promise<DomainEventEnvelope> {
    return event;
  }

  async appendMany(events: readonly DomainEventEnvelope[]): Promise<readonly DomainEventEnvelope[]> {
    return events;
  }

  async findById(): Promise<DomainEventEnvelope | null> {
    return null;
  }

  async findByAggregate(): Promise<readonly DomainEventEnvelope[]> {
    return [];
  }

  async listRecentForOrganization(
    query: Parameters<EventRepository['listRecentForOrganization']>[0],
  ): Promise<readonly DomainEventEnvelope[]> {
    return filterRecentOrganizationEvents(this.events, query);
  }

  async updateStatus(): Promise<DomainEventEnvelope> {
    throw new Error('Not implemented.');
  }
}

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

test('ListRecentOrganizationEventsUseCase scopes reads to trusted organization context', async () => {
  const useCase = new ListRecentOrganizationEventsUseCase(
    new InMemoryEventRepository([
      eventFixture({ id: identifier('event-a', 'DomainEventId') }),
      eventFixture({
        id: identifier('event-b', 'DomainEventId'),
        organizationId: ORG_B,
      }),
    ]),
  );

  const { events } = await useCase.execute(
    { organizationId: ORG_A, role: 'MEMBER' },
    { limit: 10 },
  );

  assert.equal(events.length, 1);
  assert.equal(events[0]?.id, 'event-a');
});

test('ListRecentOrganizationEventsUseCase rejects invalid limits at the application boundary', async () => {
  const useCase = new ListRecentOrganizationEventsUseCase(new InMemoryEventRepository());

  await assert.rejects(
    () => useCase.execute({ organizationId: ORG_A, role: 'MEMBER' }, { limit: 0 }),
    (error: unknown) => {
      assert.ok(error instanceof ApplicationError);
      assert.equal(error.code, 'VALIDATION_FAILED');
      return true;
    },
  );

  await assert.rejects(
    () => useCase.execute({ organizationId: ORG_A, role: 'MEMBER' }, { limit: 101 }),
    (error: unknown) => {
      assert.ok(error instanceof ApplicationError);
      assert.equal(error.code, 'VALIDATION_FAILED');
      return true;
    },
  );
});

test('ListRecentOrganizationEventsUseCase allows viewers with organization.read permission', async () => {
  const useCase = new ListRecentOrganizationEventsUseCase(
    new InMemoryEventRepository([
      eventFixture({ id: identifier('event-a', 'DomainEventId') }),
    ]),
  );

  const { events } = await useCase.execute(
    { organizationId: ORG_A, role: 'VIEWER' },
    { limit: 10 },
  );

  assert.equal(events.length, 1);
});

test('ListRecentOrganizationEventsUseCase forwards optional filters to the repository', async () => {
  const repository = new InMemoryEventRepository([
    eventFixture({ id: identifier('event-project', 'DomainEventId') }),
    eventFixture({
      id: identifier('event-milestone', 'DomainEventId') as DomainEventId,
      eventType: 'milestone.created',
      aggregateType: 'Milestone',
      aggregateId: 'milestone-1',
    }),
  ]);
  const useCase = new ListRecentOrganizationEventsUseCase(repository);

  const { events } = await useCase.execute(
    { organizationId: ORG_A, role: 'MEMBER' },
    { limit: 10, aggregateTypes: ['Milestone'] },
  );

  assert.equal(events.length, 1);
  assert.equal(events[0]?.aggregateType, 'Milestone');
});

test('ListRecentOrganizationEventsUseCase forwards occurredAtOnOrAfter to the repository', async () => {
  const cutoff = new Date('2026-07-25T12:00:00.000Z');
  const repository = new InMemoryEventRepository([
    eventFixture({
      id: identifier('event-before', 'DomainEventId'),
      occurredAt: new Date('2026-07-24T12:00:00.000Z'),
    }),
    eventFixture({
      id: identifier('event-after', 'DomainEventId'),
      occurredAt: new Date('2026-07-26T12:00:00.000Z'),
    }),
  ]);
  const useCase = new ListRecentOrganizationEventsUseCase(repository);

  const { events } = await useCase.execute(
    { organizationId: ORG_A, role: 'MEMBER' },
    { limit: 10, occurredAtOnOrAfter: cutoff },
  );

  assert.equal(events.length, 1);
  assert.equal(events[0]?.id, 'event-after');
});
