import type {
  CorrelationId,
  Identifier,
  OrganizationId,
  RequestContext,
  RequestId,
  UserId,
} from '@synaptria/core';

export type DomainEventId = Identifier<'DomainEventId'>;

export type EventJsonPrimitive = string | number | boolean | null;
export type EventJsonValue = EventJsonPrimitive | EventJsonObject | readonly EventJsonValue[];
export type EventJsonObject = Readonly<{ [key: string]: EventJsonValue }>;

export const DOMAIN_EVENT_STATUSES = [
  'PENDING',
  'PROCESSING',
  'PUBLISHED',
  'FAILED',
  'DEAD_LETTER',
] as const;

export type DomainEventStatus = (typeof DOMAIN_EVENT_STATUSES)[number];

export interface DomainEventDefinition<TPayload = unknown> {
  readonly type: string;
  readonly aggregateType: string;
  readonly aggregateId: string;
  readonly payload: TPayload;
  readonly version?: number;
  readonly metadata?: Readonly<Record<string, unknown>>;
  readonly occurredAt?: Date;
  readonly availableAt?: Date;
  readonly causationId?: string;
  readonly idempotencyKey?: string;
}

export interface DomainEventEnvelope<TPayload extends EventJsonValue = EventJsonValue> {
  readonly id: DomainEventId;
  readonly organizationId: OrganizationId;
  readonly eventType: string;
  readonly eventVersion: number;
  readonly aggregateType: string;
  readonly aggregateId: string;
  readonly payload: TPayload;
  readonly metadata?: EventJsonObject;
  readonly status: DomainEventStatus;
  readonly actorId?: UserId;
  readonly requestId?: RequestId;
  readonly correlationId?: CorrelationId;
  readonly causationId?: string;
  readonly idempotencyKey?: string;
  readonly occurredAt: Date;
  readonly availableAt: Date;
  readonly publishedAt?: Date;
  readonly attempts: number;
  readonly lastError?: string;
}

export interface PublishDomainEventInput<TPayload = unknown> {
  readonly context: RequestContext;
  readonly event: DomainEventDefinition<TPayload>;
}

export interface PublishSystemEventInput<TPayload = unknown> {
  readonly organizationId: OrganizationId;
  readonly event: DomainEventDefinition<TPayload>;
  readonly correlationId?: CorrelationId;
  readonly requestId?: RequestId;
  readonly actorId?: UserId;
}

export interface PublishManyDomainEventsInput {
  readonly context: RequestContext;
  readonly events: readonly DomainEventDefinition[];
}

export interface AggregateEventQuery {
  readonly organizationId: OrganizationId;
  readonly aggregateType: string;
  readonly aggregateId: string;
  readonly limit?: number;
}

export interface OrganizationRecentEventsQuery {
  readonly organizationId: OrganizationId;
  readonly limit: number;
  readonly eventTypes?: readonly string[];
  readonly aggregateTypes?: readonly string[];
  readonly occurredAtOnOrAfter?: Date;
}
