import { AuditService } from '@synaptria/audit';
import {
  CryptoIdGenerator,
  SystemClock,
  type BudgetCategoryId,
  type Clock,
  type CorrelationId,
  type IdGenerator,
  type MembershipId,
  type OrganizationId,
  type RequestId,
  type UserId,
} from '@synaptria/core';
import type { OrganizationRole } from '@synaptria/core/context';
import { DomainEventService } from '@synaptria/events';
import { NotFoundError } from '@synaptria/core/errors';
import { PERMISSIONS, requirePermission } from '@synaptria/permissions';

import type { BudgetUnitOfWork } from './budget-unit-of-work';

export interface DeleteBudgetCategoryContext {
  readonly organizationId: OrganizationId;
  readonly userId: UserId;
  readonly membershipId: MembershipId;
  readonly role: OrganizationRole;
  readonly requestId: RequestId;
  readonly correlationId: CorrelationId;
}

export interface DeleteBudgetCategoryInput {
  readonly budgetCategoryId: BudgetCategoryId;
}

export interface DeleteBudgetCategoryOutput {
  readonly deleted: true;
}

export class DeleteBudgetCategoryUseCase {
  constructor(
    private readonly unitOfWork: BudgetUnitOfWork,
    private readonly clock: Clock = new SystemClock(),
    private readonly eventIdGenerator: IdGenerator = new CryptoIdGenerator(),
  ) {}

  async execute(context: DeleteBudgetCategoryContext, input: DeleteBudgetCategoryInput): Promise<DeleteBudgetCategoryOutput> {
    requirePermission(context.role, PERMISSIONS.FINANCE_MANAGE);

    const occurredAt = this.clock.now();

    return this.unitOfWork.execute(async (repositories) => {
      const existing = await repositories.budgetCategories.findById(context.organizationId, input.budgetCategoryId);
      if (existing === null) {
        throw new NotFoundError('BudgetCategory', { budgetCategoryId: input.budgetCategoryId });
      }

      await repositories.budgetCategories.softDelete(context.organizationId, input.budgetCategoryId);

      const audit = new AuditService(repositories.audit, this.clock);
      await audit.record({
        organizationId: context.organizationId,
        actor: { type: 'USER', id: context.userId, userId: context.userId },
        action: 'DELETE',
        target: { entityType: 'BudgetCategory', entityId: input.budgetCategoryId },
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
          type: 'budget_category.deleted',
          aggregateType: 'BudgetCategory',
          aggregateId: input.budgetCategoryId,
          payload: { budgetCategoryId: input.budgetCategoryId, organizationId: context.organizationId },
          occurredAt,
        },
      });

      return { deleted: true };
    });
  }
}
