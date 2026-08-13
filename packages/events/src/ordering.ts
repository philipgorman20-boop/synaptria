import type { DomainEventEnvelope } from './types';

/** Deterministic recent-event ordering: occurredAt desc, then event id asc. */
export function compareDomainEventsByOccurredAtDescThenId(
  left: Pick<DomainEventEnvelope, 'occurredAt' | 'id'>,
  right: Pick<DomainEventEnvelope, 'occurredAt' | 'id'>,
): number {
  const byOccurredAt = right.occurredAt.getTime() - left.occurredAt.getTime();
  if (byOccurredAt !== 0) {
    return byOccurredAt;
  }

  return left.id.localeCompare(right.id, 'en', { sensitivity: 'base' });
}
