import type { Clock } from '@synaptria/core';
import { milestoneId, projectId } from '@synaptria/core';
import type { MilestoneRepository } from '@synaptria/domain/milestones';
import type { ProjectRepository } from '@synaptria/domain/projects';
import type { TaskRepository } from '@synaptria/domain/tasks';
import type { ContextContribution, ContextPayload } from '@synaptria/domain/context';
import { hasPermission, PERMISSIONS } from '@synaptria/permissions';

import { CONTEXT_CONTRIBUTOR_IDS } from '../contributor-ids';
import { mapMilestoneToContextPayload } from '../mappers/milestone-mapper';
import { mapTaskToContextPayload } from '../mappers/task-mapper';
import { createOperationalProvenance } from '../provenance';
import type { ContextProvider } from '../ports/context-provider';
import { compareByNameThenId } from '../sorting';

export interface RelatedEntitiesProviderResult {
  readonly contributions: readonly ContextContribution[];
  readonly permissionRestricted: boolean;
}

export class RelatedEntitiesContextProvider implements ContextProvider {
  readonly contributorId = CONTEXT_CONTRIBUTOR_IDS.relatedEntities;
  readonly sections = ['relatedEntities'] as const;

  constructor(
    private readonly projects: ProjectRepository,
    private readonly milestones: MilestoneRepository,
    private readonly tasks: TaskRepository,
    private readonly clock: Clock,
  ) {}

  async contribute(input: Parameters<ContextProvider['contribute']>[0]): Promise<
    readonly ContextContribution[]
  > {
    return (await this.contributeWithMetadata(input)).contributions;
  }

  async contributeWithMetadata(
    input: Parameters<ContextProvider['contribute']>[0],
  ): Promise<RelatedEntitiesProviderResult> {
    const { primaryEntity } = input.request;

    if (primaryEntity.entityType === 'Project') {
      return this.loadProjectMilestones(input);
    }

    if (primaryEntity.entityType === 'Milestone') {
      return this.loadMilestoneTasks(input);
    }

    return { contributions: [], permissionRestricted: false };
  }

  private async loadProjectMilestones(
    input: Parameters<ContextProvider['contribute']>[0],
  ): Promise<RelatedEntitiesProviderResult> {
    if (!hasPermission(input.authorization.role, PERMISSIONS.MILESTONES_READ)) {
      return { contributions: [], permissionRestricted: true };
    }

    const milestones = [...(await this.milestones.listForProject(
      input.identity.organizationId,
      projectId(input.request.primaryEntity.entityId),
    ))].sort(compareByNameThenId);

    const entities: ContextPayload[] = milestones.map(mapMilestoneToContextPayload);

    if (entities.length === 0) {
      return { contributions: [], permissionRestricted: false };
    }

    return {
      contributions: [
        {
          contributorId: this.contributorId,
          section: 'relatedEntities',
          subject: null,
          payload: { entities },
          provenance: createOperationalProvenance({
            clock: this.clock,
            sourceType: 'Milestone',
            sourceId: input.request.primaryEntity.entityId,
            retrievalMethod: 'repository.list',
            permissionScope: [PERMISSIONS.MILESTONES_READ],
          }),
        },
      ],
      permissionRestricted: false,
    };
  }

  private async loadMilestoneTasks(
    input: Parameters<ContextProvider['contribute']>[0],
  ): Promise<RelatedEntitiesProviderResult> {
    if (!hasPermission(input.authorization.role, PERMISSIONS.TASKS_READ)) {
      return { contributions: [], permissionRestricted: true };
    }

    const tasks = [...(await this.tasks.listForMilestone(
      input.identity.organizationId,
      milestoneId(input.request.primaryEntity.entityId),
    ))].sort(compareByNameThenId);

    const entities: ContextPayload[] = tasks.map(mapTaskToContextPayload);

    if (entities.length === 0) {
      return { contributions: [], permissionRestricted: false };
    }

    return {
      contributions: [
        {
          contributorId: this.contributorId,
          section: 'relatedEntities',
          subject: null,
          payload: { entities },
          provenance: createOperationalProvenance({
            clock: this.clock,
            sourceType: 'Task',
            sourceId: input.request.primaryEntity.entityId,
            retrievalMethod: 'repository.list',
            permissionScope: [PERMISSIONS.TASKS_READ],
          }),
        },
      ],
      permissionRestricted: false,
    };
  }
}
