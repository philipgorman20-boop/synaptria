import type {
  DomainEvent as PrismaDomainEvent,
  Prisma,
  PrismaClient,
} from '@prisma/client';
import type {
  AggregateEventQuery,
  DomainEventEnvelope,
  DomainEventId,
  DomainEventStatus,
  EventJsonObject,
  EventRepository,
} from '@synaptria/events';
import {
  identifier,
  type CorrelationId,
  type OrganizationId,
  type RequestId,
  type UserId,
} from '@synaptria/core';

import { toPrismaJson } from '../json';

const INTERNAL_METADATA_KEY = '__synaptriaEvent';

interface StoredInternalEventMetadata {
  readonly actorId?: string;
  readonly requestId?: string;
  readonly idempotencyKey?: string;
  readonly occurredAt: string;
}

interface ParsedInternalEventMetadata {
  readonly actorId?: string;
  readonly requestId?: string;
  readonly idempotencyKey?: string;
  readonly occurredAt?: Date;
}

export type EventDatabaseClient = Pick<PrismaClient, 'domainEvent'>;

export class PrismaEventRepository implements EventRepository {
  constructor(private readonly client: EventDatabaseClient) {}

  async append(
    event: DomainEventEnvelope,
  ): Promise<DomainEventEnvelope> {
    const row = await this.client.domainEvent.create({
      data: toCreateData(event),
    });

    return mapDomainEvent(row);
  }

  async appendMany(
    events: readonly DomainEventEnvelope[],
  ): Promise<readonly DomainEventEnvelope[]> {
    const persisted: DomainEventEnvelope[] = [];

    for (const event of events) {
      persisted.push(await this.append(event));
    }

    return persisted;
  }

  async findById(
    id: DomainEventId,
  ): Promise<DomainEventEnvelope | null> {
    const row = await this.client.domainEvent.findUnique({
      where: { id },
    });

    return row === null ? null : mapDomainEvent(row);
  }

  async findByAggregate(
    query: AggregateEventQuery,
  ): Promise<readonly DomainEventEnvelope[]> {
    const rows = await this.client.domainEvent.findMany({
      where: {
        organizationId: query.organizationId,
        aggregateType: query.aggregateType,
        aggregateId: query.aggregateId,
      },
      orderBy: {
        createdAt: 'asc',
      },
      ...(query.limit === undefined
        ? {}
        : { take: query.limit }),
    });

    return rows.map(mapDomainEvent);
  }

  async updateStatus(
    id: DomainEventId,
    status: DomainEventStatus,
    changes?: Readonly<{
      publishedAt?: Date;
      attempts?: number;
      lastError?: string | null;
    }>,
  ): Promise<DomainEventEnvelope> {
    const row = await this.client.domainEvent.update({
      where: { id },
      data: {
        status,
        ...(changes?.publishedAt === undefined
          ? {}
          : { publishedAt: changes.publishedAt }),
        ...(changes?.attempts === undefined
          ? {}
          : { attempts: changes.attempts }),
        ...(changes?.lastError === undefined
          ? {}
          : { lastError: changes.lastError }),
      },
    });

    return mapDomainEvent(row);
  }
}

function toCreateData(
  event: DomainEventEnvelope,
): Prisma.DomainEventUncheckedCreateInput {
  const internalMetadata: StoredInternalEventMetadata = {
    ...(event.actorId === undefined
      ? {}
      : { actorId: event.actorId }),
    ...(event.requestId === undefined
      ? {}
      : { requestId: event.requestId }),
    ...(event.idempotencyKey === undefined
      ? {}
      : { idempotencyKey: event.idempotencyKey }),
    occurredAt: event.occurredAt.toISOString(),
  };

  const metadata = {
    ...(event.metadata ?? {}),
    [INTERNAL_METADATA_KEY]: internalMetadata,
  };

  return {
    id: event.id,
    organizationId: event.organizationId,
    aggregateType: event.aggregateType,
    aggregateId: event.aggregateId,
    eventType: event.eventType,
    eventVersion: event.eventVersion,
    payload: toPrismaJson(event.payload),
    metadata: toPrismaJson(metadata),
    status: event.status,
    correlationId: event.correlationId ?? null,
    causationId: event.causationId ?? null,
    availableAt: event.availableAt,
    publishedAt: event.publishedAt ?? null,
    attempts: event.attempts,
    lastError: event.lastError ?? null,
    createdAt: event.occurredAt,
  };
}

function mapDomainEvent(
  row: PrismaDomainEvent,
): DomainEventEnvelope {
  const rawMetadata = isRecord(row.metadata)
    ? row.metadata
    : {};

  const internal = parseInternalMetadata(
    rawMetadata[INTERNAL_METADATA_KEY],
  );

  const publicMetadata = Object.fromEntries(
    Object.entries(rawMetadata).filter(
      ([key]) => key !== INTERNAL_METADATA_KEY,
    ),
  ) as EventJsonObject;

  return {
    id: identifier(
      row.id,
      'DomainEventId',
    ) as DomainEventId,
    organizationId: identifier(
      row.organizationId,
      'OrganizationId',
    ) as OrganizationId,
    eventType: row.eventType,
    eventVersion: row.eventVersion,
    aggregateType: row.aggregateType,
    aggregateId: row.aggregateId,
    payload: row.payload as DomainEventEnvelope['payload'],
    ...(Object.keys(publicMetadata).length === 0
      ? {}
      : { metadata: publicMetadata }),
    status: row.status,
    ...(internal.actorId === undefined
      ? {}
      : {
          actorId: identifier(
            internal.actorId,
            'UserId',
          ) as UserId,
        }),
    ...(internal.requestId === undefined
      ? {}
      : {
          requestId: identifier(
            internal.requestId,
            'RequestId',
          ) as RequestId,
        }),
    ...(row.correlationId === null
      ? {}
      : {
          correlationId: identifier(
            row.correlationId,
            'CorrelationId',
          ) as CorrelationId,
        }),
    ...(row.causationId === null
      ? {}
      : { causationId: row.causationId }),
    ...(internal.idempotencyKey === undefined
      ? {}
      : { idempotencyKey: internal.idempotencyKey }),
    occurredAt: internal.occurredAt ?? row.createdAt,
    availableAt: row.availableAt,
    ...(row.publishedAt === null
      ? {}
      : { publishedAt: row.publishedAt }),
    attempts: row.attempts,
    ...(row.lastError === null
      ? {}
      : { lastError: row.lastError }),
  };
}

function isRecord(
  value: unknown,
): value is Record<string, unknown> {
  return (
    typeof value === 'object' &&
    value !== null &&
    !Array.isArray(value)
  );
}

function parseInternalMetadata(
  value: unknown,
): ParsedInternalEventMetadata {
  if (!isRecord(value)) {
    return {};
  }

  const parsedOccurredAt =
    typeof value.occurredAt === 'string'
      ? new Date(value.occurredAt)
      : undefined;

  const occurredAt =
    parsedOccurredAt !== undefined &&
    !Number.isNaN(parsedOccurredAt.getTime())
      ? parsedOccurredAt
      : undefined;

  return {
    ...(typeof value.actorId === 'string'
      ? { actorId: value.actorId }
      : {}),
    ...(typeof value.requestId === 'string'
      ? { requestId: value.requestId }
      : {}),
    ...(typeof value.idempotencyKey === 'string'
      ? { idempotencyKey: value.idempotencyKey }
      : {}),
    ...(occurredAt === undefined
      ? {}
      : { occurredAt }),
  };
}
