import type { Clock } from '@synaptria/core';
import { milestoneId, projectId } from '@synaptria/core';
import type { ContextContribution, EntityReference } from '@synaptria/domain/context';
import type { MilestoneRepository } from '@synaptria/domain/milestones';
import type { TaskRepository } from '@synaptria/domain/tasks';
import type { EventRepository } from '@synaptria/events';
import { hasPermission, PERMISSIONS } from '@synaptria/permissions';

import { CONTEXT_CONTRIBUTOR_IDS } from '../contributor-ids';
import { aggregateTypeForEntityType, toEntityReference } from '../mappers/entity-reference';
import { mapDomainEventToContextSnapshot } from '../mappers/event-mapper';
import { createEventProvenance } from '../provenance';
import type { ContextProvider } from '../ports/context-provider';
import { compareByNameThenId, compareEntityReferences, compareEventsByOccurredAtDescThenId } from '../sorting';

interface AggregateTarget {
  readonly reference: EntityReference;
  readonly permission: (typeof PERMISSIONS)[keyof typeof PERMISSIONS];
}

export class AggregateEventContextProvider implements ContextProvider {
  readonly contributorId = CONTEXT_CONTRIBUTOR_IDS.events;
  readonly sections = ['events'] as const;

  constructor(
    private readonly events: EventRepository,
    private readonly milestones: MilestoneRepository,
    private readonly tasks: TaskRepository,
    private readonly clock: Clock,
  ) {}

  async contribute(input: Parameters<ContextProvider['contribute']>[0]): Promise<
    readonly ContextContribution[]
  > {
    const contributions: ContextContribution[] = [];
    const targets = [...(await this.resolveAggregateTargets(input))].sort((left, right) =>
      compareEntityReferences(left.reference, right.reference),
    );

    for (const target of targets) {
      if (!hasPermission(input.authorization.role, target.permission)) {
        continue;
      }

      const aggregateEvents = await this.events.findByAggregate({
        organizationId: input.identity.organizationId,
        aggregateType: aggregateTypeForEntityType(target.reference.entityType),
        aggregateId: target.reference.entityId,
        limit: input.scope.eventLookbackPerAggregate,
      });

      const eventSnapshots = [...aggregateEvents]
        .sort(compareEventsByOccurredAtDescThenId)
        .map(mapDomainEventToContextSnapshot);

      contributions.push({
        contributorId: this.contributorId,
        section: 'events',
        subject: target.reference,
        payload: { events: eventSnapshots },
        provenance: createEventProvenance({
          clock: this.clock,
          aggregateType: target.reference.entityType,
          aggregateId: target.reference.entityId,
          permissionScope: [target.permission],
        }),
      });
    }

    return contributions.sort((left, right) => {
      if (left.subject === null || right.subject === null) {
        return 0;
      }
      return compareEntityReferences(left.subject, right.subject);
    });
  }

  private async resolveAggregateTargets(
    input: Parameters<ContextProvider['contribute']>[0],
  ): Promise<readonly AggregateTarget[]> {
    const { primaryEntity } = input.request;
    const organizationId = input.identity.organizationId;
    const targets: AggregateTarget[] = [
      {
        reference: primaryEntity,
        permission: permissionForEntityType(primaryEntity.entityType),
      },
    ];

    if (primaryEntity.entityType === 'Project') {
      if (!hasPermission(input.authorization.role, PERMISSIONS.MILESTONES_READ)) {
        return targets;
      }

      const milestones = [...(await this.milestones.listForProject(
        organizationId,
        projectId(primaryEntity.entityId),
      ))].sort(compareByNameThenId);

      for (const milestone of milestones) {
        targets.push({
          reference: toEntityReference({
            organizationId,
            entityType: 'Milestone',
            entityId: milestone.id,
          }),
          permission: PERMISSIONS.MILESTONES_READ,
        });
      }
    }

    if (primaryEntity.entityType === 'Milestone') {
      if (!hasPermission(input.authorization.role, PERMISSIONS.TASKS_READ)) {
        return targets;
      }

      const tasks = [...(await this.tasks.listForMilestone(
        organizationId,
        milestoneId(primaryEntity.entityId),
      ))].sort(compareByNameThenId);

      for (const task of tasks) {
        targets.push({
          reference: toEntityReference({
            organizationId,
            entityType: 'Task',
            entityId: task.id,
          }),
          permission: PERMISSIONS.TASKS_READ,
        });
      }
    }

    return targets;
  }
}

function permissionForEntityType(
  entityType: EntityReference['entityType'],
): (typeof PERMISSIONS)[keyof typeof PERMISSIONS] {
  switch (entityType) {
    case 'Project':
      return PERMISSIONS.PROJECTS_READ;
    case 'Milestone':
      return PERMISSIONS.MILESTONES_READ;
    case 'Task':
      return PERMISSIONS.TASKS_READ;
    default:
      return PERMISSIONS.ORGANIZATION_READ;
  }
}
