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
import type {
  CreateMilestoneInput as RepositoryCreateMilestoneInput,
  Milestone,
  MilestonePriority,
  MilestoneStatus,
} from '@synaptria/domain/milestones';
import { DomainEventService } from '@synaptria/events';
import { PERMISSIONS, requirePermission } from '@synaptria/permissions';

import { ApplicationError } from '../../shared/application-error';
import type { MilestoneUnitOfWork } from './milestone-unit-of-work';

export interface CreateMilestoneContext {
  readonly organizationId: OrganizationId;
  readonly userId: UserId;
  readonly membershipId: MembershipId;
  readonly role: OrganizationRole;
  readonly requestId: RequestId;
  readonly correlationId: CorrelationId;
}

export interface CreateMilestoneInput {
  readonly projectId: ProjectId;
  readonly name: string;
  readonly description?: string;
  readonly status?: MilestoneStatus;
  readonly priority?: MilestonePriority;
  readonly plannedStartDate?: Date;
  readonly plannedEndDate?: Date;
  readonly actualStartDate?: Date;
  readonly actualEndDate?: Date;
}

export interface CreateMilestoneOutput {
  readonly milestone: Milestone;
}

const MILESTONE_STATUSES = [
  'PLANNED',
  'IN_PROGRESS',
  'BLOCKED',
  'COMPLETED',
  'CANCELLED',
] as const satisfies readonly MilestoneStatus[];

const MILESTONE_PRIORITIES = [
  'LOW',
  'MEDIUM',
  'HIGH',
  'CRITICAL',
] as const satisfies readonly MilestonePriority[];

export class CreateMilestoneUseCase {
  constructor(
    private readonly unitOfWork: MilestoneUnitOfWork,
    private readonly clock: Clock = new SystemClock(),
    private readonly eventIdGenerator: IdGenerator = new CryptoIdGenerator(),
  ) {}

  async execute(
    context: CreateMilestoneContext,
    input: CreateMilestoneInput,
  ): Promise<CreateMilestoneOutput> {
    requirePermission(context.role, PERMISSIONS.MILESTONES_MANAGE);

    const normalized = normalizeInput(input);
    const occurredAt = this.clock.now();

    return this.unitOfWork.execute(async (repositories) => {
      const project = await repositories.projects.findById(
        context.organizationId,
        normalized.projectId,
      );

      if (project === null || project.deletedAt !== undefined) {
        throw new ApplicationError({
          code: 'NOT_FOUND',
          message: 'The requested project was not found.',
          details: { field: 'projectId', projectId: normalized.projectId },
        });
      }

      const repositoryInput: RepositoryCreateMilestoneInput = {
        organizationId: context.organizationId,
        projectId: normalized.projectId,
        name: normalized.name,
        status: normalized.status ?? 'PLANNED',
        priority: normalized.priority ?? 'MEDIUM',
        ...(normalized.description === undefined
          ? {}
          : { description: normalized.description }),
        ...(normalized.plannedStartDate === undefined
          ? {}
          : { plannedStartDate: normalized.plannedStartDate }),
        ...(normalized.plannedEndDate === undefined
          ? {}
          : { plannedEndDate: normalized.plannedEndDate }),
        ...(normalized.actualStartDate === undefined
          ? {}
          : { actualStartDate: normalized.actualStartDate }),
        ...(normalized.actualEndDate === undefined
          ? {}
          : { actualEndDate: normalized.actualEndDate }),
      };

      const milestone = await repositories.milestones.create(repositoryInput);

      const audit = new AuditService(repositories.audit, this.clock);
      await audit.record({
        organizationId: context.organizationId,
        actor: {
          type: 'USER',
          id: context.userId,
          userId: context.userId,
        },
        action: 'CREATE',
        target: {
          entityType: 'Milestone',
          entityId: milestone.id,
        },
        request: {
          requestId: context.requestId,
          correlationId: context.correlationId,
        },
        after: {
          id: milestone.id,
          projectId: milestone.projectId,
          name: milestone.name,
          status: milestone.status,
          priority: milestone.priority,
        },
        occurredAt,
      });

      const events = new DomainEventService(
        repositories.events,
        this.clock,
        this.eventIdGenerator,
      );
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
          type: 'milestone.created',
          aggregateType: 'Milestone',
          aggregateId: milestone.id,
          payload: {
            milestoneId: milestone.id,
            organizationId: context.organizationId,
            projectId: milestone.projectId,
            name: milestone.name,
            status: milestone.status,
            createdByUserId: context.userId,
          },
          occurredAt,
        },
      });

      return { milestone };
    });
  }
}

function normalizeInput(input: CreateMilestoneInput): CreateMilestoneInput {
  const name = requireText(input.name, 'name');

  if (input.status !== undefined && !isMilestoneStatus(input.status)) {
    throw validationError('status must be a supported milestone status.', 'status');
  }

  if (input.priority !== undefined && !isMilestonePriority(input.priority)) {
    throw validationError(
      'priority must be a supported milestone priority.',
      'priority',
    );
  }

  if (
    input.plannedStartDate !== undefined &&
    input.plannedEndDate !== undefined &&
    input.plannedStartDate.getTime() > input.plannedEndDate.getTime()
  ) {
    throw validationError(
      'plannedStartDate must be on or before plannedEndDate.',
      'plannedStartDate',
    );
  }

  if (
    input.actualStartDate !== undefined &&
    input.actualEndDate !== undefined &&
    input.actualStartDate.getTime() > input.actualEndDate.getTime()
  ) {
    throw validationError(
      'actualStartDate must be on or before actualEndDate.',
      'actualStartDate',
    );
  }

  return {
    projectId: input.projectId,
    name,
    ...(input.description === undefined
      ? {}
      : { description: optionalText(input.description, 'description') }),
    ...(input.status === undefined ? {} : { status: input.status }),
    ...(input.priority === undefined ? {} : { priority: input.priority }),
    ...(input.plannedStartDate === undefined
      ? {}
      : { plannedStartDate: input.plannedStartDate }),
    ...(input.plannedEndDate === undefined
      ? {}
      : { plannedEndDate: input.plannedEndDate }),
    ...(input.actualStartDate === undefined
      ? {}
      : { actualStartDate: input.actualStartDate }),
    ...(input.actualEndDate === undefined ? {} : { actualEndDate: input.actualEndDate }),
  };
}

function requireText(value: string, field: string): string {
  const normalized = value.trim();
  if (normalized.length === 0) {
    throw validationError(`${field} cannot be empty.`, field);
  }
  return normalized;
}

function optionalText(value: string, field: string): string {
  const normalized = value.trim();
  if (normalized.length === 0) {
    throw validationError(`${field} cannot be empty.`, field);
  }
  return normalized;
}

function isMilestoneStatus(value: string): value is MilestoneStatus {
  return (MILESTONE_STATUSES as readonly string[]).includes(value);
}

function isMilestonePriority(value: string): value is MilestonePriority {
  return (MILESTONE_PRIORITIES as readonly string[]).includes(value);
}

function validationError(message: string, field: string): ApplicationError {
  return new ApplicationError({
    code: 'VALIDATION_FAILED',
    message,
    details: { field },
  });
}
