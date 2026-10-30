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
import type { FundingEvent, FundingEventStatus, FundingEventType } from '@synaptria/domain/budgets';
import { DomainEventService } from '@synaptria/events';
import { PERMISSIONS, requirePermission } from '@synaptria/permissions';

import { ApplicationError } from '../../shared/application-error';
import type { BudgetUnitOfWork } from './budget-unit-of-work';

export interface CreateFundingEventContext {
  readonly organizationId: OrganizationId;
  readonly userId: UserId;
  readonly membershipId: MembershipId;
  readonly role: OrganizationRole;
  readonly requestId: RequestId;
  readonly correlationId: CorrelationId;
}

export interface CreateFundingEventInput {
  readonly name: string;
  readonly type: FundingEventType;
  readonly status?: FundingEventStatus;
  readonly amount: number;
  readonly currency?: string;
  readonly receivedAt?: Date;
  readonly expectedAt?: Date;
  readonly investor?: string;
  readonly notes?: string;
}

export interface CreateFundingEventOutput {
  readonly fundingEvent: FundingEvent;
}

export class CreateFundingEventUseCase {
  constructor(
    private readonly unitOfWork: BudgetUnitOfWork,
    private readonly clock: Clock = new SystemClock(),
    private readonly eventIdGenerator: IdGenerator = new CryptoIdGenerator(),
  ) {}

  async execute(context: CreateFundingEventContext, input: CreateFundingEventInput): Promise<CreateFundingEventOutput> {
    requirePermission(context.role, PERMISSIONS.FINANCE_MANAGE);

    const name = requireText(input.name, 'name');
    if (input.amount <= 0) {
      throw new ApplicationError({ code: 'VALIDATION_FAILED', message: 'amount must be positive.', details: { field: 'amount' } });
    }

    const occurredAt = this.clock.now();

    return this.unitOfWork.execute(async (repositories) => {
      const fundingEvent = await repositories.fundingEvents.create({
        organizationId: context.organizationId,
        name,
        type: input.type,
        ...(input.status !== undefined ? { status: input.status } : {}),
        amount: input.amount,
        ...(input.currency !== undefined ? { currency: input.currency } : {}),
        ...(input.receivedAt !== undefined ? { receivedAt: input.receivedAt } : {}),
        ...(input.expectedAt !== undefined ? { expectedAt: input.expectedAt } : {}),
        ...(input.investor !== undefined ? { investor: input.investor } : {}),
        ...(input.notes !== undefined ? { notes: input.notes } : {}),
      });

      const audit = new AuditService(repositories.audit, this.clock);
      await audit.record({
        organizationId: context.organizationId,
        actor: { type: 'USER', id: context.userId, userId: context.userId },
        action: 'CREATE',
        target: { entityType: 'FundingEvent', entityId: fundingEvent.id },
        request: { requestId: context.requestId, correlationId: context.correlationId },
        after: { id: fundingEvent.id, name: fundingEvent.name, type: fundingEvent.type },
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
          type: 'funding_event.created',
          aggregateType: 'FundingEvent',
          aggregateId: fundingEvent.id,
          payload: {
            fundingEventId: fundingEvent.id,
            organizationId: context.organizationId,
            name: fundingEvent.name,
            type: fundingEvent.type,
          },
          occurredAt,
        },
      });

      return { fundingEvent };
    });
  }
}

function requireText(value: string, field: string): string {
  const normalized = value.trim();
  if (normalized.length === 0) {
    throw new ApplicationError({ code: 'VALIDATION_FAILED', message: `${field} cannot be empty.`, details: { field } });
  }
  return normalized;
}
