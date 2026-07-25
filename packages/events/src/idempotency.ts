import type { OrganizationId } from '@synaptria/core';
import type { DomainEventEnvelope } from './types';

export interface EventIdempotencyClaim {
  readonly organizationId: OrganizationId;
  readonly key: string;
  readonly operation: string;
  readonly expiresAt: Date;
}

export type EventIdempotencyResult =
  | { readonly acquired: true }
  | { readonly acquired: false; readonly existingEvent?: DomainEventEnvelope };

export interface EventIdempotencyStore {
  acquire(claim: EventIdempotencyClaim): Promise<EventIdempotencyResult>;
  complete(claim: EventIdempotencyClaim, event: DomainEventEnvelope): Promise<void>;
  release(claim: EventIdempotencyClaim): Promise<void>;
}

export class DuplicateEventError extends Error {
  readonly code = 'DUPLICATE_DOMAIN_EVENT';

  constructor(readonly key: string, readonly existingEvent?: DomainEventEnvelope) {
    super(`A domain event has already been published for idempotency key "${key}".`);
    this.name = 'DuplicateEventError';
  }
}

export class InMemoryEventIdempotencyStore implements EventIdempotencyStore {
  private readonly claims = new Map<string, DomainEventEnvelope | null>();

  async acquire(claim: EventIdempotencyClaim): Promise<EventIdempotencyResult> {
    const mapKey = this.mapKey(claim);
    if (this.claims.has(mapKey)) {
      const existing = this.claims.get(mapKey);
      if (existing === null || existing === undefined) {
        return { acquired: false };
      }
      return { acquired: false, existingEvent: existing };
    }

    this.claims.set(mapKey, null);
    return { acquired: true };
  }

  async complete(claim: EventIdempotencyClaim, event: DomainEventEnvelope): Promise<void> {
    this.claims.set(this.mapKey(claim), event);
  }

  async release(claim: EventIdempotencyClaim): Promise<void> {
    this.claims.delete(this.mapKey(claim));
  }

  private mapKey(claim: EventIdempotencyClaim): string {
    return `${claim.organizationId}:${claim.operation}:${claim.key}`;
  }
}
