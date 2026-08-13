import type {
  AggregateEventQuery,
  DomainEventEnvelope,
  DomainEventId,
  DomainEventStatus,
  OrganizationRecentEventsQuery,
} from './types';

export interface EventRepository {
  append(event: DomainEventEnvelope): Promise<DomainEventEnvelope>;
  appendMany(events: readonly DomainEventEnvelope[]): Promise<readonly DomainEventEnvelope[]>;
  findById(id: DomainEventId): Promise<DomainEventEnvelope | null>;
  findByAggregate(query: AggregateEventQuery): Promise<readonly DomainEventEnvelope[]>;
  listRecentForOrganization(
    query: OrganizationRecentEventsQuery,
  ): Promise<readonly DomainEventEnvelope[]>;
  updateStatus(
    id: DomainEventId,
    status: DomainEventStatus,
    changes?: Readonly<{
      publishedAt?: Date;
      attempts?: number;
      lastError?: string | null;
    }>,
  ): Promise<DomainEventEnvelope>;
}
