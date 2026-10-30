import { AuditService } from '@synaptria/audit';
import {
  CryptoIdGenerator,
  SystemClock,
  type Clock,
  type CorrelationId,
  type IdGenerator,
  type MembershipId,
  type OrganizationId,
  type ProgramId,
  type RequestId,
  type UserId,
} from '@synaptria/core';
import type { OrganizationRole } from '@synaptria/core/context';
import type {
  CreateProjectInput as RepositoryCreateProjectInput,
  Project,
  ProjectPriority,
  ProjectStatus,
} from '@synaptria/domain/projects';
import { DomainEventService } from '@synaptria/events';
import { PERMISSIONS, requirePermission } from '@synaptria/permissions';

import { ApplicationError } from '../../shared/application-error';
import type { ProjectUnitOfWork } from './project-unit-of-work';

export interface CreateProjectContext {
  readonly organizationId: OrganizationId;
  readonly userId: UserId;
  readonly membershipId: MembershipId;
  readonly role: OrganizationRole;
  readonly requestId: RequestId;
  readonly correlationId: CorrelationId;
}

export interface CreateProjectInput {
  readonly name: string;
  readonly programId?: ProgramId;
  readonly code?: string;
  readonly description?: string;
  readonly status?: ProjectStatus;
  readonly priority?: ProjectPriority;
  readonly percentComplete?: number;
  readonly startDate?: Date;
  readonly targetEndDate?: Date;
}

export interface CreateProjectOutput {
  readonly project: Project;
}

const PROJECT_STATUSES = [
  'PLANNED',
  'ACTIVE',
  'ON_HOLD',
  'COMPLETED',
  'CANCELLED',
] as const satisfies readonly ProjectStatus[];

const PROJECT_PRIORITIES = [
  'LOW',
  'MEDIUM',
  'HIGH',
  'CRITICAL',
] as const satisfies readonly ProjectPriority[];

export class CreateProjectUseCase {
  constructor(
    private readonly unitOfWork: ProjectUnitOfWork,
    private readonly clock: Clock = new SystemClock(),
    private readonly eventIdGenerator: IdGenerator = new CryptoIdGenerator(),
  ) {}

  async execute(
    context: CreateProjectContext,
    input: CreateProjectInput,
  ): Promise<CreateProjectOutput> {
    requirePermission(context.role, PERMISSIONS.PROJECTS_MANAGE);

    const normalized = normalizeInput(input);
    const occurredAt = this.clock.now();

    return this.unitOfWork.execute(async (repositories) => {
      if (normalized.programId !== undefined) {
        const program = await repositories.programs.findById(
          context.organizationId,
          normalized.programId,
        );

        if (program === null || program.deletedAt !== undefined) {
          throw new ApplicationError({
            code: 'NOT_FOUND',
            message: 'The requested program was not found.',
            details: { field: 'programId', programId: normalized.programId },
          });
        }
      }

      const existingByName = await repositories.projects.findByName(
        context.organizationId,
        normalized.name,
      );

      if (existingByName !== null) {
        throw new ApplicationError({
          code: 'CONFLICT',
          message: 'A project with this name already exists.',
          details: { field: 'name', name: normalized.name },
        });
      }

      if (normalized.code !== undefined) {
        const existingByCode = await repositories.projects.findByCode(
          context.organizationId,
          normalized.code,
        );

        if (existingByCode !== null) {
          throw new ApplicationError({
            code: 'CONFLICT',
            message: 'A project with this code already exists.',
            details: { field: 'code', code: normalized.code },
          });
        }
      }

      const repositoryInput: RepositoryCreateProjectInput = {
        organizationId: context.organizationId,
        ownerId: context.userId,
        name: normalized.name,
        status: normalized.status ?? 'PLANNED',
        priority: normalized.priority ?? 'MEDIUM',
        percentComplete: normalized.percentComplete ?? 0,
        ...(normalized.programId === undefined
          ? {}
          : { programId: normalized.programId }),
        ...(normalized.code === undefined ? {} : { code: normalized.code }),
        ...(normalized.description === undefined
          ? {}
          : { description: normalized.description }),
        ...(normalized.startDate === undefined
          ? {}
          : { startDate: normalized.startDate }),
        ...(normalized.targetEndDate === undefined
          ? {}
          : { targetEndDate: normalized.targetEndDate }),
      };

      const project = await repositories.projects.create(repositoryInput);

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
          entityType: 'Project',
          entityId: project.id,
        },
        request: {
          requestId: context.requestId,
          correlationId: context.correlationId,
        },
        after: {
          id: project.id,
          name: project.name,
          code: project.code ?? null,
          status: project.status,
          priority: project.priority,
          programId: project.programId ?? null,
          ownerId: project.ownerId ?? null,
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
          type: 'project.created',
          aggregateType: 'Project',
          aggregateId: project.id,
          payload: {
            projectId: project.id,
            organizationId: context.organizationId,
            programId: project.programId ?? null,
            name: project.name,
            code: project.code ?? null,
            status: project.status,
            createdByUserId: context.userId,
          },
          occurredAt,
        },
      });

      return { project };
    });
  }
}

function normalizeInput(input: CreateProjectInput): CreateProjectInput {
  const name = requireText(input.name, 'name');

  if (input.status !== undefined && !isProjectStatus(input.status)) {
    throw validationError('status must be a supported project status.', 'status');
  }

  if (input.priority !== undefined && !isProjectPriority(input.priority)) {
    throw validationError(
      'priority must be a supported project priority.',
      'priority',
    );
  }

  if (input.percentComplete !== undefined && !isValidPercentComplete(input.percentComplete)) {
    throw validationError(
      'percentComplete must be an integer between 0 and 100.',
      'percentComplete',
    );
  }

  if (
    input.startDate !== undefined &&
    input.targetEndDate !== undefined &&
    input.startDate.getTime() >= input.targetEndDate.getTime()
  ) {
    throw validationError(
      'startDate must be before targetEndDate.',
      'startDate',
    );
  }

  const code =
    input.code === undefined ? undefined : normalizeCode(input.code);

  return {
    name,
    ...(input.programId === undefined ? {} : { programId: input.programId }),
    ...(code === undefined ? {} : { code }),
    ...(input.description === undefined
      ? {}
      : { description: optionalText(input.description, 'description') }),
    ...(input.status === undefined ? {} : { status: input.status }),
    ...(input.priority === undefined ? {} : { priority: input.priority }),
    ...(input.percentComplete === undefined
      ? {}
      : { percentComplete: input.percentComplete }),
    ...(input.startDate === undefined ? {} : { startDate: input.startDate }),
    ...(input.targetEndDate === undefined
      ? {}
      : { targetEndDate: input.targetEndDate }),
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

function normalizeCode(value: string): string {
  const code = value.trim().toUpperCase();
  if (!/^[A-Z0-9]+(?:-[A-Z0-9]+)*$/.test(code)) {
    throw validationError(
      'code must contain uppercase letters, numbers, and single hyphens only.',
      'code',
    );
  }
  return code;
}

function isProjectStatus(value: string): value is ProjectStatus {
  return (PROJECT_STATUSES as readonly string[]).includes(value);
}

function isProjectPriority(value: string): value is ProjectPriority {
  return (PROJECT_PRIORITIES as readonly string[]).includes(value);
}

function isValidPercentComplete(value: number): boolean {
  return Number.isInteger(value) && value >= 0 && value <= 100;
}

function validationError(message: string, field: string): ApplicationError {
  return new ApplicationError({
    code: 'VALIDATION_FAILED',
    message,
    details: { field },
  });
}
