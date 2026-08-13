import type { OrganizationId } from '@synaptria/core';
import type { OrganizationRole } from '@synaptria/core/context';
import type { DomainEventEnvelope } from '@synaptria/events';
import type { EventRepository } from '@synaptria/events';
import { PERMISSIONS, requirePermission } from '@synaptria/permissions';

import { validateRecentOrganizationEventsLimit } from './validate-recent-organization-events-limit';

export interface ListRecentOrganizationEventsContext {
  readonly organizationId: OrganizationId;
  readonly role: OrganizationRole;
}

export interface ListRecentOrganizationEventsInput {
  readonly limit: number;
  readonly eventTypes?: readonly string[];
  readonly aggregateTypes?: readonly string[];
}

export interface ListRecentOrganizationEventsOutput {
  readonly events: readonly DomainEventEnvelope[];
}

/**
 * Lists recent domain events for the authenticated organization.
 *
 * Organization scope is taken from trusted application context, never from
 * client-controlled payloads.
 */
export class ListRecentOrganizationEventsUseCase {
  constructor(private readonly events: EventRepository) {}

  async execute(
    context: ListRecentOrganizationEventsContext,
    input: ListRecentOrganizationEventsInput,
  ): Promise<ListRecentOrganizationEventsOutput> {
    requirePermission(context.role, PERMISSIONS.ORGANIZATION_READ);

    const limit = validateRecentOrganizationEventsLimit(input.limit);
    const events = await this.events.listRecentForOrganization({
      organizationId: context.organizationId,
      limit,
      ...(input.eventTypes === undefined || input.eventTypes.length === 0
        ? {}
        : { eventTypes: input.eventTypes }),
      ...(input.aggregateTypes === undefined || input.aggregateTypes.length === 0
        ? {}
        : { aggregateTypes: input.aggregateTypes }),
    });

    return { events };
  }
}
