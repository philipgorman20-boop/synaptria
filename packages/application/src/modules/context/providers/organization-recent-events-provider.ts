import type { Clock } from '@synaptria/core';
import type { OrganizationId } from '@synaptria/core';
import type { ContextAuthorization, ContextContribution } from '@synaptria/domain/context';
import type { EventRepository } from '@synaptria/events';
import { PERMISSIONS, requirePermission } from '@synaptria/permissions';

import { CONTEXT_CONTRIBUTOR_IDS } from '../contributor-ids';
import { mapDomainEventToContextSnapshot } from '../mappers/event-mapper';
import { createOrganizationRecentEventsProvenance } from '../provenance';
import { validateRecentOrganizationEventsLimit } from '../../events/validate-recent-organization-events-limit';

export interface OrganizationRecentEventsQuery {
  readonly organizationId: OrganizationId;
  readonly authorization: ContextAuthorization;
  readonly limit: number;
  readonly eventTypes?: readonly string[];
  readonly aggregateTypes?: readonly string[];
}

/**
 * Reusable context provider for organization-scoped recent activity.
 *
 * Intended for future organization capabilities such as Mission Control and
 * Daily Briefing without introducing a full organization intelligence capability yet.
 */
export class OrganizationRecentEventsProvider {
  readonly contributorId = CONTEXT_CONTRIBUTOR_IDS.events;
  readonly sections = ['events'] as const;

  constructor(
    private readonly events: EventRepository,
    private readonly clock: Clock,
  ) {}

  async loadRecentEvents(
    query: OrganizationRecentEventsQuery,
  ): Promise<readonly ContextContribution[]> {
    requirePermission(query.authorization.role, PERMISSIONS.ORGANIZATION_READ);

    const limit = validateRecentOrganizationEventsLimit(query.limit);
    const recentEvents = await this.events.listRecentForOrganization({
      organizationId: query.organizationId,
      limit,
      ...(query.eventTypes === undefined || query.eventTypes.length === 0
        ? {}
        : { eventTypes: query.eventTypes }),
      ...(query.aggregateTypes === undefined || query.aggregateTypes.length === 0
        ? {}
        : { aggregateTypes: query.aggregateTypes }),
    });

    return [
      {
        contributorId: this.contributorId,
        section: 'events',
        subject: null,
        payload: {
          events: recentEvents.map(mapDomainEventToContextSnapshot),
        },
        provenance: createOrganizationRecentEventsProvenance({
          clock: this.clock,
          permissionScope: [PERMISSIONS.ORGANIZATION_READ],
        }),
      },
    ];
  }
}
