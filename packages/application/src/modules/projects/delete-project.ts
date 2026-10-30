import { AuditService } from '@synaptria/audit';
import {
  CryptoIdGenerator,
  SystemClock,
  type Clock,
  type CorrelationId,
  type IdGenerator,
  type MembershipId,
  type OrganizationId,
  type ProjectId,
  type RequestId,
  type UserId,
} from '@synaptria/core';
import type { OrganizationRole } from '@synaptria/core/context';
import { DomainEventService } from '@synaptria/events';
import { PERMISSIONS, requirePermission } from '@synaptria/permissions';

import { ApplicationError } from '../../shared/application-error';
import type { ProjectUnitOfWork } from './project-unit-of-work';

export interface DeleteProjectContext {
  readonly organizationId: OrganizationId;
  readonly userId: UserId;
  readonly membershipId: MembershipId;
  readonly role: OrganizationRole;
  readonly requestId: RequestId;
  readonly correlationId: CorrelationId;
}

export interface DeleteProjectInput {
  readonly projectId: ProjectId;
}

export interface DeleteProjectOutput {
  readonly projectId: ProjectId;
}

export class DeleteProjectUseCase {
  constructor(
    private readonly unitOfWork: ProjectUnitOfWork,
    private readonly clock: Clock = new SystemClock(),
    private readonly eventIdGenerator: IdGenerator = new CryptoIdGenerator(),
  ) {}

  async execute(context: DeleteProjectContext, input: DeleteProjectInput): Promise<DeleteProjectOutput> {
    requirePermission(context.role, PERMISSIONS.PROJECTS_MANAGE);

    const occurredAt = this.clock.now();

    return this.unitOfWork.execute(async (repositories) => {
      const existing = await repositories.projects.findById(context.organizationId, input.projectId);
      if (existing === null || existing.deletedAt !== undefined) {
        throw new ApplicationError({ code: 'NOT_FOUND', message: 'Project not found.', details: { field: 'projectId' } });
      }

      const project = await repositories.projects.softDelete(context.organizationId, input.projectId, occurredAt);

      const audit = new AuditService(repositories.audit, this.clock);
      await audit.record({
        organizationId: context.organizationId,
        actor: { type: 'USER', id: context.userId, userId: context.userId },
        action: 'DELETE',
        target: { entityType: 'Project', entityId: project.id },
        request: { requestId: context.requestId, correlationId: context.correlationId },
        before: { id: existing.id, name: existing.name },
        after: null,
        occurredAt,
      });

      const events = new DomainEventService(repositories.events, this.clock, this.eventIdGenerator);
      await events.publish({
        context: {
          userId: context.userId,
          organizationId: context.organizationId,
          membershipId: context.membershipId,
          role: context.role,
          requestId: context.requestId,
          correlationId: context.correlationId,
        },
        event: {
          type: 'project.deleted',
          aggregateType: 'Project',
          aggregateId: project.id,
          payload: {
            projectId: project.id,
            organizationId: context.organizationId,
            deletedByUserId: context.userId,
          },
          occurredAt,
        },
      });

      return { projectId: project.id };
    });
  }
}
