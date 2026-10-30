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
  Program,
  ProgramPriority,
  ProgramStatus,
  UpdateProgramInput as RepositoryUpdateProgramInput,
} from '@synaptria/domain/programs';
import { DomainEventService } from '@synaptria/events';
import { PERMISSIONS, requirePermission } from '@synaptria/permissions';

import { ApplicationError } from '../../shared/application-error';
import type { ProgramUnitOfWork } from './program-unit-of-work';

export interface UpdateProgramContext {
  readonly organizationId: OrganizationId;
  readonly userId: UserId;
  readonly membershipId: MembershipId;
  readonly role: OrganizationRole;
  readonly requestId: RequestId;
  readonly correlationId: CorrelationId;
}

export interface UpdateProgramInput {
  readonly programId: ProgramId;
  readonly name?: string;
  readonly description?: string | null;
  readonly indication?: string | null;
  readonly modality?: string | null;
  readonly target?: string | null;
  readonly status?: ProgramStatus;
  readonly priority?: ProgramPriority;
}

export interface UpdateProgramOutput {
  readonly program: Program;
}

export class UpdateProgramUseCase {
  constructor(
    private readonly unitOfWork: ProgramUnitOfWork,
    private readonly clock: Clock = new SystemClock(),
    private readonly eventIdGenerator: IdGenerator = new CryptoIdGenerator(),
  ) {}

  async execute(context: UpdateProgramContext, input: UpdateProgramInput): Promise<UpdateProgramOutput> {
    requirePermission(context.role, PERMISSIONS.PROGRAMS_MANAGE);

    const repositoryInput: RepositoryUpdateProgramInput = {};

    if (input.name !== undefined) {
      const name = input.name.trim();
      if (name.length === 0) {
        throw new ApplicationError({ code: 'VALIDATION_FAILED', message: 'name cannot be empty.', details: { field: 'name' } });
      }
      (repositoryInput as Record<string, unknown>).name = name;
    }

    if (input.description !== undefined) (repositoryInput as Record<string, unknown>).description = input.description;
    if (input.indication !== undefined) (repositoryInput as Record<string, unknown>).indication = input.indication;
    if (input.modality !== undefined) (repositoryInput as Record<string, unknown>).modality = input.modality;
    if (input.target !== undefined) (repositoryInput as Record<string, unknown>).target = input.target;
    if (input.status !== undefined) (repositoryInput as Record<string, unknown>).status = input.status;
    if (input.priority !== undefined) (repositoryInput as Record<string, unknown>).priority = input.priority;

    const occurredAt = this.clock.now();

    return this.unitOfWork.execute(async (repositories) => {
      const existing = await repositories.programs.findById(context.organizationId, input.programId);
      if (existing === null || existing.deletedAt !== undefined) {
        throw new ApplicationError({ code: 'NOT_FOUND', message: 'Program not found.', details: { field: 'programId' } });
      }

      const program = await repositories.programs.update(context.organizationId, input.programId, repositoryInput);

      const audit = new AuditService(repositories.audit, this.clock);
      await audit.record({
        organizationId: context.organizationId,
        actor: { type: 'USER', id: context.userId, userId: context.userId },
        action: 'UPDATE',
        target: { entityType: 'Program', entityId: program.id },
        request: { requestId: context.requestId, correlationId: context.correlationId },
        before: { id: existing.id, name: existing.name, status: existing.status },
        after: { id: program.id, name: program.name, status: program.status },
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
          type: 'program.updated',
          aggregateType: 'Program',
          aggregateId: program.id,
          payload: {
            programId: program.id,
            organizationId: context.organizationId,
            name: program.name,
            status: program.status,
            updatedByUserId: context.userId,
          },
          occurredAt,
        },
      });

      return { program };
    });
  }
}
