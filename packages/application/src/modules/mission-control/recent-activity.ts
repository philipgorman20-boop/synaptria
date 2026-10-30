import type { DomainEventEnvelope } from '@synaptria/events';

import type { MissionControlRecentActivityItem } from './types';

export function mapRecentActivityItems(
  events: readonly DomainEventEnvelope[],
): readonly MissionControlRecentActivityItem[] {
  return events.map((event) => ({
    eventId: event.id,
    eventType: event.eventType,
    aggregateType: event.aggregateType,
    aggregateId: event.aggregateId,
    occurredAt: event.occurredAt.toISOString(),
  }));
}
