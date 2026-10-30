import type { DomainEventEnvelope } from '@synaptria/events';
import type { ContextPayload } from '@synaptria/domain/context';

export function mapDomainEventToContextSnapshot(
  event: DomainEventEnvelope,
): ContextPayload {
  return {
    id: event.id,
    eventType: event.eventType,
    eventVersion: event.eventVersion,
    aggregateType: event.aggregateType,
    aggregateId: event.aggregateId,
    occurredAt: event.occurredAt.toISOString(),
    payload: event.payload,
  };
}
