import { compareDomainEventsByOccurredAtDescThenId } from './ordering';
import type { DomainEventEnvelope, OrganizationRecentEventsQuery } from './types';

export function filterRecentOrganizationEvents(
  events: readonly DomainEventEnvelope[],
  query: OrganizationRecentEventsQuery,
): readonly DomainEventEnvelope[] {
  const eventTypeFilter =
    query.eventTypes === undefined || query.eventTypes.length === 0
      ? null
      : new Set(query.eventTypes);
  const aggregateTypeFilter =
    query.aggregateTypes === undefined || query.aggregateTypes.length === 0
      ? null
      : new Set(query.aggregateTypes);

  return [...events]
    .filter((event) => event.organizationId === query.organizationId)
    .filter(
      (event) => eventTypeFilter === null || eventTypeFilter.has(event.eventType),
    )
    .filter(
      (event) =>
        aggregateTypeFilter === null || aggregateTypeFilter.has(event.aggregateType),
    )
    .sort(compareDomainEventsByOccurredAtDescThenId)
    .slice(0, query.limit);
}
