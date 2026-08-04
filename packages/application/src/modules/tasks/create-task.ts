import { AuditService } from '@synaptria/audit';
import {
  CryptoIdGenerator,
  SystemClock,
  CoreError,
  type Clock,
  type CorrelationId,
  type IdGenerator,
  type MembershipId,
  type MilestoneId,
  type OrganizationId,
  type RequestId,
  type UserId,
} from '@synaptria/core';
import type { OrganizationRole } from '@synaptria/core/context';
import type { Priority } from '@synaptria/domain/shared';
import type {
  CreateTaskInput as RepositoryCreateTaskInput,
  Task,
  TaskStatus,
} from '@synaptria/domain/tasks';
import {
  applyCreateTaskDefaults,
  normalizeCreateTaskInput,
} from '@synaptria/domain/tasks';
import { DomainEventService } from '@synaptria/events';
import { PERMISSIONS, requirePermission } from '@synaptria/permissions';

import { ApplicationError } from '../../shared/application-error';
import type { TaskUnitOfWork } from './task-unit-of-work';

export interface CreateTaskContext {
  readonly organizationId: OrganizationId;
  readonly userId: UserId;
  readonly membershipId: MembershipId;
  readonly role: OrganizationRole;
  readonly requestId: RequestId;
  readonly correlationId: CorrelationId;
}

export interface CreateTaskInput {
  readonly milestoneId: MilestoneId;
  readonly name: string;
  readonly description?: string;
  readonly status?: TaskStatus;
  readonly priority?: Priority;
  readonly plannedStartDate?: Date;
  readonly plannedEndDate?: Date;
  readonly actualStartDate?: Date;
  readonly actualEndDate?: Date;
}

export interface CreateTaskOutput {
  readonly task: Task;
}

export class CreateTaskUseCase {
  constructor(
    private readonly unitOfWork: TaskUnitOfWork,
    private readonly clock: Clock = new SystemClock(),
    private readonly eventIdGenerator: IdGenerator = new CryptoIdGenerator(),
  ) {}

  async execute(
    context: CreateTaskContext,
    input: CreateTaskInput,
  ): Promise<CreateTaskOutput> {
    requirePermission(context.role, PERMISSIONS.TASKS_MANAGE);

    const normalized = normalizeAndApplyDefaults(context, input);
    const occurredAt = this.clock.now();

    return this.unitOfWork.execute(async (repositories) => {
      const milestone = await repositories.milestones.findById(
        context.organizationId,
        normalized.milestoneId,
      );

      if (milestone === null) {
        throw new ApplicationError({
          code: 'NOT_FOUND',
          message: 'The requested milestone was not found.',
          details: { field: 'milestoneId', milestoneId: normalized.milestoneId },
        });
      }

      const repositoryInput: RepositoryCreateTaskInput = {
        organizationId: context.organizationId,
        milestoneId: normalized.milestoneId,
        name: normalized.name,
        status: normalized.status,
        priority: normalized.priority,
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

      const task = await repositories.tasks.create(repositoryInput);

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
          entityType: 'Task',
          entityId: task.id,
        },
        request: {
          requestId: context.requestId,
          correlationId: context.correlationId,
        },
        after: {
          id: task.id,
          milestoneId: task.milestoneId,
          name: task.name,
          status: task.status,
          priority: task.priority,
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
          type: 'task.created',
          aggregateType: 'Task',
          aggregateId: task.id,
          payload: {
            taskId: task.id,
            organizationId: context.organizationId,
            milestoneId: task.milestoneId,
            name: task.name,
            status: task.status,
            createdByUserId: context.userId,
          },
          occurredAt,
        },
      });

      return { task };
    });
  }
}

function normalizeAndApplyDefaults(
  context: CreateTaskContext,
  input: CreateTaskInput,
) {
  try {
    return applyCreateTaskDefaults(
      normalizeCreateTaskInput({
        organizationId: context.organizationId,
        milestoneId: input.milestoneId,
        name: input.name,
        ...(input.description === undefined
          ? {}
          : { description: input.description }),
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
        ...(input.actualEndDate === undefined
          ? {}
          : { actualEndDate: input.actualEndDate }),
      }),
    );
  } catch (error) {
    if (error instanceof CoreError && error.code === 'VALIDATION_FAILED') {
      throw new ApplicationError({
        code: 'VALIDATION_FAILED',
        message: error.message,
        ...(error.details === undefined ? {} : { details: error.details }),
      });
    }

    throw error;
  }
}
