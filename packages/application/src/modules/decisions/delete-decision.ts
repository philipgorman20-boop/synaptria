import { AuditService } from '@synaptria/audit';
import {
  CryptoIdGenerator,
  SystemClock,
  type Clock,
  type CorrelationId,
  type DecisionId,
  type IdGenerator,
  type MembershipId,
  type OrganizationId,
  type RequestId,
  type UserId,
} from '@synaptria/core';
import type { OrganizationRole } from '@synaptria/core/context';
import { DomainEventService } from '@synaptria/events';
import { PERMISSIONS, requirePermission } from '@synaptria/permissions';

import { ApplicationError } from '../../shared/application-error';
import type { DecisionUnitOfWork } from './decision-unit-of-work';

export interface DeleteDecisionContext {
  readonly organizationId: OrganizationId;
  readonly userId: UserId;
  readonly membershipId: MembershipId;
  readonly role: OrganizationRole;
  readonly requestId: RequestId;
  readonly correlationId: CorrelationId;
}

export interface DeleteDecisionInput {
  readonly decisionId: DecisionId;
}

export interface DeleteDecisionOutput {
  readonly decisionId: DecisionId;
}

export class DeleteDecisionUseCase {
  constructor(
    private readonly unitOfWork: DecisionUnitOfWork,
    private readonly clock: Clock = new SystemClock(),
    private readonly eventIdGenerator: IdGenerator = new CryptoIdGenerator(),
  ) {}

  async execute(context: DeleteDecisionContext, input: DeleteDecisionInput): Promise<DeleteDecisionOutput> {
    requirePermission(context.role, PERMISSIONS.PROGRAMS_MANAGE);

    const occurredAt = this.clock.now();

    return this.unitOfWork.execute(async (repositories) => {
      const existing = await repositories.decisions.findById(context.organizationId, input.decisionId);
      if (existing === null || existing.deletedAt !== undefined) {
        throw new ApplicationError({ code: 'NOT_FOUND', message: 'Decision not found.', details: { field: 'decisionId' } });
      }

      const decision = await repositories.decisions.softDelete(context.organizationId, input.decisionId, occurredAt);

      const audit = new AuditService(repositories.audit, this.clock);
      await audit.record({
        organizationId: context.organizationId,
        actor: { type: 'USER', id: context.userId, userId: context.userId },
        action: 'DELETE',
        target: { entityType: 'Decision', entityId: decision.id },
        request: { requestId: context.requestId, correlationId: context.correlationId },
        before: { id: existing.id, title: existing.title, status: existing.status },
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
          type: 'decision.deleted',
          aggregateType: 'Decision',
          aggregateId: decision.id,
          payload: {
            decisionId: decision.id,
            organizationId: context.organizationId,
            deletedByUserId: context.userId,
          },
          occurredAt,
        },
      });

      return { decisionId: decision.id };
    });
  }
}
