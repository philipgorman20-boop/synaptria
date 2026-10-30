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
import { DomainEventService } from '@synaptria/events';
import { PERMISSIONS, requirePermission } from '@synaptria/permissions';

import { ApplicationError } from '../../shared/application-error';
import type { ProgramUnitOfWork } from './program-unit-of-work';

export interface DeleteProgramContext {
  readonly organizationId: OrganizationId;
  readonly userId: UserId;
  readonly membershipId: MembershipId;
  readonly role: OrganizationRole;
  readonly requestId: RequestId;
  readonly correlationId: CorrelationId;
}

export interface DeleteProgramInput {
  readonly programId: ProgramId;
}

export interface DeleteProgramOutput {
  readonly programId: ProgramId;
}

export class DeleteProgramUseCase {
  constructor(
    private readonly unitOfWork: ProgramUnitOfWork,
    private readonly clock: Clock = new SystemClock(),
    private readonly eventIdGenerator: IdGenerator = new CryptoIdGenerator(),
  ) {}

  async execute(context: DeleteProgramContext, input: DeleteProgramInput): Promise<DeleteProgramOutput> {
    requirePermission(context.role, PERMISSIONS.PROGRAMS_MANAGE);

    const occurredAt = this.clock.now();

    return this.unitOfWork.execute(async (repositories) => {
      const existing = await repositories.programs.findById(context.organizationId, input.programId);
      if (existing === null || existing.deletedAt !== undefined) {
        throw new ApplicationError({ code: 'NOT_FOUND', message: 'Program not found.', details: { field: 'programId' } });
      }

      const program = await repositories.programs.softDelete(context.organizationId, input.programId, occurredAt);

      const audit = new AuditService(repositories.audit, this.clock);
      await audit.record({
        organizationId: context.organizationId,
        actor: { type: 'USER', id: context.userId, userId: context.userId },
        action: 'DELETE',
        target: { entityType: 'Program', entityId: program.id },
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
          type: 'program.deleted',
          aggregateType: 'Program',
          aggregateId: program.id,
          payload: {
            programId: program.id,
            organizationId: context.organizationId,
            deletedByUserId: context.userId,
          },
          occurredAt,
        },
      });

      return { programId: program.id };
    });
  }
}
