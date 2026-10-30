import { AuditService } from '@synaptria/audit';
import {
  CryptoIdGenerator,
  SystemClock,
  type Clock,
  type CorrelationId,
  type FundingEventId,
  type IdGenerator,
  type MembershipId,
  type OrganizationId,
  type RequestId,
  type UserId,
} from '@synaptria/core';
import type { OrganizationRole } from '@synaptria/core/context';
import { DomainEventService } from '@synaptria/events';
import { PERMISSIONS, requirePermission } from '@synaptria/permissions';

import type { BudgetUnitOfWork } from './budget-unit-of-work';

export interface DeleteFundingEventContext {
  readonly organizationId: OrganizationId;
  readonly userId: UserId;
  readonly membershipId: MembershipId;
  readonly role: OrganizationRole;
  readonly requestId: RequestId;
  readonly correlationId: CorrelationId;
}

export interface DeleteFundingEventInput {
  readonly fundingEventId: FundingEventId;
}

export interface DeleteFundingEventOutput {
  readonly deleted: true;
}

export class DeleteFundingEventUseCase {
  constructor(
    private readonly unitOfWork: BudgetUnitOfWork,
    private readonly clock: Clock = new SystemClock(),
    private readonly eventIdGenerator: IdGenerator = new CryptoIdGenerator(),
  ) {}

  async execute(context: DeleteFundingEventContext, input: DeleteFundingEventInput): Promise<DeleteFundingEventOutput> {
    requirePermission(context.role, PERMISSIONS.FINANCE_MANAGE);

    const occurredAt = this.clock.now();

    return this.unitOfWork.execute(async (repositories) => {
      await repositories.fundingEvents.softDelete(context.organizationId, input.fundingEventId);

      const audit = new AuditService(repositories.audit, this.clock);
      await audit.record({
        organizationId: context.organizationId,
        actor: { type: 'USER', id: context.userId, userId: context.userId },
        action: 'DELETE',
        target: { entityType: 'FundingEvent', entityId: input.fundingEventId },
        request: { requestId: context.requestId, correlationId: context.correlationId },
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
          type: 'funding_event.deleted',
          aggregateType: 'FundingEvent',
          aggregateId: input.fundingEventId,
          payload: { fundingEventId: input.fundingEventId, organizationId: context.organizationId },
          occurredAt,
        },
      });

      return { deleted: true };
    });
  }
}
