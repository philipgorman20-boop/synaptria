import type { Clock } from '@synaptria/core';
import { milestoneId, projectId } from '@synaptria/core';
import type { MilestoneRepository } from '@synaptria/domain/milestones';
import type { ProjectRepository } from '@synaptria/domain/projects';
import type { ContextContribution } from '@synaptria/domain/context';
import { PERMISSIONS, requirePermission } from '@synaptria/permissions';

import { ApplicationError } from '../../../shared/application-error';
import { CONTEXT_CONTRIBUTOR_IDS } from '../contributor-ids';
import { toEntityReference } from '../mappers/entity-reference';
import { mapMilestoneToContextPayload } from '../mappers/milestone-mapper';
import { mapProjectToContextPayload } from '../mappers/project-mapper';
import { createOperationalProvenance } from '../provenance';
import type { ContextProvider } from '../ports/context-provider';

export class PrimaryEntityContextProvider implements ContextProvider {
  readonly contributorId = CONTEXT_CONTRIBUTOR_IDS.primaryEntity;
  readonly sections = ['primaryEntity'] as const;

  constructor(
    private readonly projects: ProjectRepository,
    private readonly milestones: MilestoneRepository,
    private readonly clock: Clock,
  ) {}

  async contribute(input: Parameters<ContextProvider['contribute']>[0]): Promise<
    readonly ContextContribution[]
  > {
    const { primaryEntity } = input.request;

    switch (primaryEntity.entityType) {
      case 'Project':
        return [await this.loadProject(input, primaryEntity.entityId)];
      case 'Milestone':
        return [await this.loadMilestone(input, primaryEntity.entityId)];
      default:
        throw new ApplicationError({
          code: 'VALIDATION_FAILED',
          message: 'Unsupported primary entity type for context assembly.',
          details: { entityType: primaryEntity.entityType },
        });
    }
  }

  private async loadProject(
    input: Parameters<ContextProvider['contribute']>[0],
    entityId: string,
  ): Promise<ContextContribution> {
    requirePermission(input.authorization.role, PERMISSIONS.PROJECTS_READ);

    const project = await this.projects.findById(
      input.identity.organizationId,
      projectId(entityId),
    );

    if (project === null || project.deletedAt !== undefined) {
      throw new ApplicationError({
        code: 'NOT_FOUND',
        message: 'The requested project was not found.',
        details: { projectId: entityId },
      });
    }

    const subject = toEntityReference({
      organizationId: project.organizationId,
      entityType: 'Project',
      entityId: project.id,
    });

    return {
      contributorId: this.contributorId,
      section: 'primaryEntity',
      subject,
      payload: mapProjectToContextPayload(project),
      provenance: createOperationalProvenance({
        clock: this.clock,
        sourceType: 'Project',
        sourceId: project.id,
        retrievalMethod: 'repository.read',
        permissionScope: [PERMISSIONS.PROJECTS_READ],
      }),
    };
  }

  private async loadMilestone(
    input: Parameters<ContextProvider['contribute']>[0],
    entityId: string,
  ): Promise<ContextContribution> {
    requirePermission(input.authorization.role, PERMISSIONS.MILESTONES_READ);

    const milestone = await this.milestones.findById(
      input.identity.organizationId,
      milestoneId(entityId),
    );

    if (milestone === null) {
      throw new ApplicationError({
        code: 'NOT_FOUND',
        message: 'The requested milestone was not found.',
        details: { milestoneId: entityId },
      });
    }

    const subject = toEntityReference({
      organizationId: milestone.organizationId,
      entityType: 'Milestone',
      entityId: milestone.id,
    });

    return {
      contributorId: this.contributorId,
      section: 'primaryEntity',
      subject,
      payload: mapMilestoneToContextPayload(milestone),
      provenance: createOperationalProvenance({
        clock: this.clock,
        sourceType: 'Milestone',
        sourceId: milestone.id,
        retrievalMethod: 'repository.read',
        permissionScope: [PERMISSIONS.MILESTONES_READ],
      }),
    };
  }
}
