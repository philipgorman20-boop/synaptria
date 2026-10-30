import { AuditService } from '@synaptria/audit';
import {
  CryptoIdGenerator,
  SystemClock,
  type BudgetLineId,
  type Clock,
  type CorrelationId,
  type IdGenerator,
  type MembershipId,
  type OrganizationId,
  type RequestId,
  type UserId,
} from '@synaptria/core';
import { NotFoundError } from '@synaptria/core/errors';
import type { OrganizationRole } from '@synaptria/core/context';
import { DomainEventService } from '@synaptria/events';
import { PERMISSIONS, requirePermission } from '@synaptria/permissions';

import type { BudgetUnitOfWork } from './budget-unit-of-work';

export interface DeleteBudgetLineContext {
  readonly organizationId: OrganizationId;
  readonly userId: UserId;
  readonly membershipId: MembershipId;
  readonly role: OrganizationRole;
  readonly requestId: RequestId;
  readonly correlationId: CorrelationId;
}

export interface DeleteBudgetLineInput {
  readonly budgetLineId: BudgetLineId;
}

export interface DeleteBudgetLineOutput {
  readonly deleted: true;
}

export class DeleteBudgetLineUseCase {
  constructor(
    private readonly unitOfWork: BudgetUnitOfWork,
    private readonly clock: Clock = new SystemClock(),
    private readonly eventIdGenerator: IdGenerator = new CryptoIdGenerator(),
  ) {}

  async execute(context: DeleteBudgetLineContext, input: DeleteBudgetLineInput): Promise<DeleteBudgetLineOutput> {
    requirePermission(context.role, PERMISSIONS.FINANCE_MANAGE);

    const occurredAt = this.clock.now();

    return this.unitOfWork.execute(async (repositories) => {
      const existing = await repositories.budgetLines.findById(context.organizationId, input.budgetLineId);
      if (existing === null) {
        throw new NotFoundError('BudgetLine', { budgetLineId: input.budgetLineId });
      }

      await repositories.budgetLines.softDelete(context.organizationId, input.budgetLineId);

      const audit = new AuditService(repositories.audit, this.clock);
      await audit.record({
        organizationId: context.organizationId,
        actor: { type: 'USER', id: context.userId, userId: context.userId },
        action: 'DELETE',
        target: { entityType: 'BudgetLine', entityId: input.budgetLineId },
        request: { requestId: context.requestId, correlationId: context.correlationId },
        before: { id: existing.id, name: existing.name },
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
          type: 'budget_line.deleted',
          aggregateType: 'BudgetLine',
          aggregateId: input.budgetLineId,
          payload: { budgetLineId: input.budgetLineId, organizationId: context.organizationId },
          occurredAt,
        },
      });

      return { deleted: true };
    });
  }
}
