import assert from 'node:assert/strict';
import test from 'node:test';

import { FixedClock, identifier, organizationId } from '@synaptria/core';
import { filterRecentOrganizationEvents } from '@synaptria/events';
import type { DomainEventEnvelope, EventRepository } from '@synaptria/events';
import { permissionsForRole } from '@synaptria/permissions';

import { ApplicationError } from '../../../shared/application-error';
import { OrganizationRecentEventsProvider } from './organization-recent-events-provider';

const ORG_A = organizationId('org-a');
const ORG_B = organizationId('org-b');
const NOW = new Date('2026-07-26T16:00:00.000Z');

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
    occurredAt: NOW,
    availableAt: NOW,
    attempts: 0,
    ...overrides,
  };
}

test('OrganizationRecentEventsProvider maps recent events into context contributions', async () => {
  const provider = new OrganizationRecentEventsProvider(
    new InMemoryEventRepository([
      eventFixture({ id: identifier('event-a', 'DomainEventId') }),
      eventFixture({
        id: identifier('event-b', 'DomainEventId'),
        organizationId: ORG_B,
      }),
    ]),
    new FixedClock(NOW),
  );

  const contributions = await provider.loadRecentEvents({
    organizationId: ORG_A,
    authorization: {
      role: 'MEMBER',
      effectivePermissions: [...permissionsForRole('MEMBER')],
    },
    limit: 10,
  });

  assert.equal(contributions.length, 1);
  assert.equal(contributions[0]?.section, 'events');
  assert.equal(contributions[0]?.subject, null);
  assert.equal(
    (contributions[0]?.payload.events as readonly { id: string }[]).length,
    1,
  );
  assert.equal(contributions[0]?.provenance.retrievalMethod, 'eventRepository.listRecentForOrganization');
  assert.deepEqual(contributions[0]?.provenance.permissionScope, ['organization.read']);
});

test('OrganizationRecentEventsProvider rejects invalid limits before repository reads', async () => {
  let repositoryCalled = false;
  const provider = new OrganizationRecentEventsProvider(
    {
      async append() {
        throw new Error('not used');
      },
      async appendMany() {
        return [];
      },
      async findById() {
        return null;
      },
      async findByAggregate() {
        return [];
      },
      async listRecentForOrganization() {
        repositoryCalled = true;
        return [];
      },
      async updateStatus() {
        throw new Error('not used');
      },
    },
    new FixedClock(NOW),
  );

  await assert.rejects(
    () =>
      provider.loadRecentEvents({
        organizationId: ORG_A,
        authorization: {
          role: 'MEMBER',
          effectivePermissions: [...permissionsForRole('MEMBER')],
        },
        limit: 0,
      }),
    (error: unknown) => {
      assert.ok(error instanceof ApplicationError);
      assert.equal(error.code, 'VALIDATION_FAILED');
      return true;
    },
  );

  assert.equal(repositoryCalled, false);
});

test('OrganizationRecentEventsProvider produces deterministic output across repeated reads', async () => {
  const repository = new InMemoryEventRepository([
    eventFixture({
      id: identifier('event-1', 'DomainEventId'),
      occurredAt: new Date('2026-07-26T12:00:00.000Z'),
    }),
    eventFixture({
      id: identifier('event-2', 'DomainEventId'),
      occurredAt: new Date('2026-07-26T12:00:00.000Z'),
    }),
  ]);
  const provider = new OrganizationRecentEventsProvider(repository, new FixedClock(NOW));
  const query = {
    organizationId: ORG_A,
    authorization: {
      role: 'MEMBER' as const,
      effectivePermissions: [...permissionsForRole('MEMBER')],
    },
    limit: 10,
  };

  const first = await provider.loadRecentEvents(query);
  const second = await provider.loadRecentEvents(query);

  assert.deepEqual(first, second);
});
