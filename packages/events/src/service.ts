import {
  CryptoIdGenerator,
  SystemClock,
  identifier,
  type Clock,
  type IdGenerator,
  type OrganizationId,
  type RequestContext,
} from '@synaptria/core';

import type { EventIdempotencyClaim, EventIdempotencyStore } from './idempotency';
import { DuplicateEventError } from './idempotency';
import type { EventRepository } from './repository';
import { toEventJson, toEventJsonObject } from './serialization';
import type {
  DomainEventDefinition,
  DomainEventEnvelope,
  DomainEventId,
  PublishDomainEventInput,
  PublishManyDomainEventsInput,
  PublishSystemEventInput,
} from './types';

const DEFAULT_IDEMPOTENCY_TTL_MS = 24 * 60 * 60 * 1000;

function requireText(value: string, fieldName: string): string {
  const normalized = value.trim();
  if (normalized.length === 0) {
    throw new TypeError(`${fieldName} cannot be empty.`);
  }
  return normalized;
}

function requireVersion(value: number | undefined): number {
  const version = value ?? 1;
  if (!Number.isInteger(version) || version < 1) {
    throw new TypeError('event version must be a positive integer.');
  }
  return version;
}

export class DomainEventService {
  constructor(
    private readonly repository: EventRepository,
    private readonly clock: Clock = new SystemClock(),
    private readonly idGenerator: IdGenerator = new CryptoIdGenerator(),
    private readonly idempotencyStore?: EventIdempotencyStore,
  ) {}

  async publish<TPayload>(input: PublishDomainEventInput<TPayload>): Promise<DomainEventEnvelope> {
    return this.publishWithIdentity(input.context.organizationId, input.event, input.context);
  }

  async publishSystem<TPayload>(input: PublishSystemEventInput<TPayload>): Promise<DomainEventEnvelope> {
    return this.publishWithIdentity(input.organizationId, input.event, input);
  }

  async publishMany(input: PublishManyDomainEventsInput): Promise<readonly DomainEventEnvelope[]> {
    if (input.events.length === 0) {
      return [];
    }

    const envelopes = input.events.map((event) =>
      this.createEnvelope(input.context.organizationId, event, input.context),
    );

    if (envelopes.some((event) => event.idempotencyKey !== undefined)) {
      const published: DomainEventEnvelope[] = [];
      for (const event of input.events) {
        published.push(await this.publish({ context: input.context, event }));
      }
      return published;
    }

    return this.repository.appendMany(envelopes);
  }

  createEnvelope<TPayload>(
    organizationId: OrganizationId,
    event: DomainEventDefinition<TPayload>,
    identity?: Partial<Pick<RequestContext, 'userId' | 'requestId' | 'correlationId'>>,
  ): DomainEventEnvelope {
    const now = this.clock.now();
    const occurredAt = event.occurredAt ?? now;
    const availableAt = event.availableAt ?? occurredAt;

    if (Number.isNaN(occurredAt.getTime())) {
      throw new TypeError('occurredAt must be a valid date.');
    }
    if (Number.isNaN(availableAt.getTime())) {
      throw new TypeError('availableAt must be a valid date.');
    }

    const idempotencyKey = event.idempotencyKey?.trim();
    if (event.idempotencyKey !== undefined && idempotencyKey?.length === 0) {
      throw new TypeError('idempotencyKey cannot be empty.');
    }

    return {
      id: identifier(this.idGenerator.generate(), 'DomainEventId') as DomainEventId,
      organizationId,
      eventType: requireText(event.type, 'event type'),
      eventVersion: requireVersion(event.version),
      aggregateType: requireText(event.aggregateType, 'aggregate type'),
      aggregateId: requireText(event.aggregateId, 'aggregate id'),
      payload: toEventJson(event.payload),
      ...(event.metadata === undefined ? {} : { metadata: toEventJsonObject(event.metadata) }),
      status: 'PENDING',
      ...(identity?.userId === undefined ? {} : { actorId: identity.userId }),
      ...(identity?.requestId === undefined ? {} : { requestId: identity.requestId }),
      ...(identity?.correlationId === undefined ? {} : { correlationId: identity.correlationId }),
      ...(event.causationId === undefined
        ? {}
        : { causationId: requireText(event.causationId, 'causationId') }),
      ...(idempotencyKey === undefined ? {} : { idempotencyKey }),
      occurredAt,
      availableAt,
      attempts: 0,
    };
  }

  private async publishWithIdentity<TPayload>(
    organizationId: OrganizationId,
    event: DomainEventDefinition<TPayload>,
    identity: Partial<Pick<RequestContext, 'userId' | 'requestId' | 'correlationId'>>,
  ): Promise<DomainEventEnvelope> {
    const envelope = this.createEnvelope(organizationId, event, identity);
    const claim = this.createClaim(envelope);

    if (claim === undefined || this.idempotencyStore === undefined) {
      return this.repository.append(envelope);
    }

    const acquisition = await this.idempotencyStore.acquire(claim);
    if (!acquisition.acquired) {
      throw new DuplicateEventError(claim.key, acquisition.existingEvent);
    }

    try {
      const persisted = await this.repository.append(envelope);
      await this.idempotencyStore.complete(claim, persisted);
      return persisted;
    } catch (error) {
      await this.idempotencyStore.release(claim);
      throw error;
    }
  }

  private createClaim(event: DomainEventEnvelope): EventIdempotencyClaim | undefined {
    if (event.idempotencyKey === undefined) {
      return undefined;
    }

    return {
      organizationId: event.organizationId,
      key: event.idempotencyKey,
      operation: event.eventType,
      expiresAt: new Date(this.clock.now().getTime() + DEFAULT_IDEMPOTENCY_TTL_MS),
    };
  }
}
