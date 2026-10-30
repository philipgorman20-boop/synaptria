import type { DomainEventEnvelope } from '@synaptria/events';

import type { DailyBriefingRecentChange } from './types';

export function mapDailyBriefingRecentChanges(
  events: readonly DomainEventEnvelope[],
): readonly DailyBriefingRecentChange[] {
  return events.map((event) => ({
    eventId: event.id,
    eventType: event.eventType,
    aggregateType: event.aggregateType,
    aggregateId: event.aggregateId,
    occurredAt: event.occurredAt.toISOString(),
  }));
}
