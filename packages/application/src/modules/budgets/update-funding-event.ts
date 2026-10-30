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
import type { FundingEvent, FundingEventStatus, FundingEventType } from '@synaptria/domain/budgets';
import { DomainEventService } from '@synaptria/events';
import { PERMISSIONS, requirePermission } from '@synaptria/permissions';

import type { BudgetUnitOfWork } from './budget-unit-of-work';

export interface UpdateFundingEventContext {
  readonly organizationId: OrganizationId;
  readonly userId: UserId;
  readonly membershipId: MembershipId;
  readonly role: OrganizationRole;
  readonly requestId: RequestId;
  readonly correlationId: CorrelationId;
}

export interface UpdateFundingEventInput {
  readonly fundingEventId: FundingEventId;
  readonly name?: string;
  readonly type?: FundingEventType;
  readonly status?: FundingEventStatus;
  readonly amount?: number;
  readonly currency?: string;
  readonly receivedAt?: Date | null;
  readonly expectedAt?: Date | null;
  readonly investor?: string | null;
  readonly notes?: string | null;
}

export interface UpdateFundingEventOutput {
  readonly fundingEvent: FundingEvent;
}

export class UpdateFundingEventUseCase {
  constructor(
    private readonly unitOfWork: BudgetUnitOfWork,
    private readonly clock: Clock = new SystemClock(),
    private readonly eventIdGenerator: IdGenerator = new CryptoIdGenerator(),
  ) {}

  async execute(context: UpdateFundingEventContext, input: UpdateFundingEventInput): Promise<UpdateFundingEventOutput> {
    requirePermission(context.role, PERMISSIONS.FINANCE_MANAGE);

    const occurredAt = this.clock.now();

    return this.unitOfWork.execute(async (repositories) => {
      const fundingEvent = await repositories.fundingEvents.update(
        context.organizationId,
        input.fundingEventId,
        {
          ...(input.name !== undefined ? { name: input.name.trim() } : {}),
          ...(input.type !== undefined ? { type: input.type } : {}),
          ...(input.status !== undefined ? { status: input.status } : {}),
          ...(input.amount !== undefined ? { amount: input.amount } : {}),
          ...(input.currency !== undefined ? { currency: input.currency } : {}),
          ...(input.receivedAt !== undefined ? { receivedAt: input.receivedAt } : {}),
          ...(input.expectedAt !== undefined ? { expectedAt: input.expectedAt } : {}),
          ...(input.investor !== undefined ? { investor: input.investor } : {}),
          ...(input.notes !== undefined ? { notes: input.notes } : {}),
        },
      );

      const audit = new AuditService(repositories.audit, this.clock);
      await audit.record({
        organizationId: context.organizationId,
        actor: { type: 'USER', id: context.userId, userId: context.userId },
        action: 'UPDATE',
        target: { entityType: 'FundingEvent', entityId: fundingEvent.id },
        request: { requestId: context.requestId, correlationId: context.correlationId },
        after: { id: fundingEvent.id, name: fundingEvent.name },
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
          type: 'funding_event.updated',
          aggregateType: 'FundingEvent',
          aggregateId: fundingEvent.id,
          payload: { fundingEventId: fundingEvent.id, organizationId: context.organizationId },
          occurredAt,
        },
      });

      return { fundingEvent };
    });
  }
}
