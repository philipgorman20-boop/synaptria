import { AuditService } from '@synaptria/audit';
import {
  CryptoIdGenerator,
  SystemClock,
  type Clock,
  type CorrelationId,
  type IdGenerator,
  type MembershipId,
  type OrganizationId,
  type RequestId,
  type UserId,
} from '@synaptria/core';
import type { OrganizationRole } from '@synaptria/core/context';
import type {
  CreateProgramInput as RepositoryCreateProgramInput,
  Program,
  ProgramPriority,
  ProgramStatus,
} from '@synaptria/domain/programs';
import { DomainEventService } from '@synaptria/events';
import { PERMISSIONS, requirePermission } from '@synaptria/permissions';

import { ApplicationError } from '../../shared/application-error';
import type { ProgramUnitOfWork } from './program-unit-of-work';

export interface CreateProgramContext {
  readonly organizationId: OrganizationId;
  readonly userId: UserId;
  readonly membershipId: MembershipId;
  readonly role: OrganizationRole;
  readonly requestId: RequestId;
  readonly correlationId: CorrelationId;
}

export interface CreateProgramInput {
  readonly name: string;
  readonly code?: string;
  readonly description?: string;
  readonly indication?: string;
  readonly modality?: string;
  readonly target?: string;
  readonly status?: ProgramStatus;
  readonly priority?: ProgramPriority;
  readonly startDate?: Date;
  readonly targetEndDate?: Date;
}

export interface CreateProgramOutput {
  readonly program: Program;
}

const PROGRAM_STATUSES = [
  'CONCEPT',
  'DISCOVERY',
  'PRECLINICAL',
  'IND_ENABLING',
  'CLINICAL',
  'PARTNERED',
  'ON_HOLD',
  'COMPLETED',
  'TERMINATED',
] as const satisfies readonly ProgramStatus[];

const PROGRAM_PRIORITIES = [
  'LOW',
  'MEDIUM',
  'HIGH',
  'CRITICAL',
] as const satisfies readonly ProgramPriority[];

export class CreateProgramUseCase {
  constructor(
    private readonly unitOfWork: ProgramUnitOfWork,
    private readonly clock: Clock = new SystemClock(),
    private readonly eventIdGenerator: IdGenerator = new CryptoIdGenerator(),
  ) {}

  async execute(
    context: CreateProgramContext,
    input: CreateProgramInput,
  ): Promise<CreateProgramOutput> {
    requirePermission(context.role, PERMISSIONS.PROGRAMS_MANAGE);

    const normalized = normalizeInput(input);
    const occurredAt = this.clock.now();

    return this.unitOfWork.execute(async (repositories) => {
      const existingByName = await repositories.programs.findByName(
        context.organizationId,
        normalized.name,
      );

      if (existingByName !== null) {
        throw new ApplicationError({
          code: 'CONFLICT',
          message: 'A program with this name already exists.',
          details: { field: 'name', name: normalized.name },
        });
      }

      if (normalized.code !== undefined) {
        const existingByCode = await repositories.programs.findByCode(
          context.organizationId,
          normalized.code,
        );

        if (existingByCode !== null) {
          throw new ApplicationError({
            code: 'CONFLICT',
            message: 'A program with this code already exists.',
            details: { field: 'code', code: normalized.code },
          });
        }
      }

      const repositoryInput: RepositoryCreateProgramInput = {
        organizationId: context.organizationId,
        ownerId: context.userId,
        name: normalized.name,
        status: normalized.status ?? 'CONCEPT',
        priority: normalized.priority ?? 'MEDIUM',
        ...(normalized.code === undefined ? {} : { code: normalized.code }),
        ...(normalized.description === undefined
          ? {}
          : { description: normalized.description }),
        ...(normalized.indication === undefined
          ? {}
          : { indication: normalized.indication }),
        ...(normalized.modality === undefined
          ? {}
          : { modality: normalized.modality }),
        ...(normalized.target === undefined ? {} : { target: normalized.target }),
        ...(normalized.startDate === undefined
          ? {}
          : { startDate: normalized.startDate }),
        ...(normalized.targetEndDate === undefined
          ? {}
          : { targetEndDate: normalized.targetEndDate }),
      };

      const program = await repositories.programs.create(repositoryInput);

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
          entityType: 'Program',
          entityId: program.id,
        },
        request: {
          requestId: context.requestId,
          correlationId: context.correlationId,
        },
        after: {
          id: program.id,
          name: program.name,
          code: program.code ?? null,
          status: program.status,
          priority: program.priority,
          ownerId: program.ownerId ?? null,
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
          type: 'program.created',
          aggregateType: 'Program',
          aggregateId: program.id,
          payload: {
            programId: program.id,
            organizationId: context.organizationId,
            name: program.name,
            code: program.code ?? null,
            status: program.status,
            createdByUserId: context.userId,
          },
          occurredAt,
        },
      });

      return { program };
    });
  }
}

function normalizeInput(input: CreateProgramInput): CreateProgramInput {
  const name = requireText(input.name, 'name');

  if (input.status !== undefined && !isProgramStatus(input.status)) {
    throw validationError('status must be a supported program status.', 'status');
  }

  if (input.priority !== undefined && !isProgramPriority(input.priority)) {
    throw validationError(
      'priority must be a supported program priority.',
      'priority',
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
    ...(code === undefined ? {} : { code }),
    ...(input.description === undefined
      ? {}
      : { description: optionalText(input.description, 'description') }),
    ...(input.indication === undefined
      ? {}
      : { indication: optionalText(input.indication, 'indication') }),
    ...(input.modality === undefined
      ? {}
      : { modality: optionalText(input.modality, 'modality') }),
    ...(input.target === undefined
      ? {}
      : { target: optionalText(input.target, 'target') }),
    ...(input.status === undefined ? {} : { status: input.status }),
    ...(input.priority === undefined ? {} : { priority: input.priority }),
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

function isProgramStatus(value: string): value is ProgramStatus {
  return (PROGRAM_STATUSES as readonly string[]).includes(value);
}

function isProgramPriority(value: string): value is ProgramPriority {
  return (PROGRAM_PRIORITIES as readonly string[]).includes(value);
}

function validationError(message: string, field: string): ApplicationError {
  return new ApplicationError({
    code: 'VALIDATION_FAILED',
    message,
    details: { field },
  });
}
