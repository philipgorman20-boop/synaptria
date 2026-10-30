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
import type { BudgetCategory, BudgetCategoryOutflowType } from '@synaptria/domain/budgets';
import { DomainEventService } from '@synaptria/events';
import { NotFoundError } from '@synaptria/core/errors';
import { PERMISSIONS, requirePermission } from '@synaptria/permissions';

import type { BudgetUnitOfWork } from './budget-unit-of-work';

export interface UpdateBudgetCategoryContext {
  readonly organizationId: OrganizationId;
  readonly userId: UserId;
  readonly membershipId: MembershipId;
  readonly role: OrganizationRole;
  readonly requestId: RequestId;
  readonly correlationId: CorrelationId;
}

export interface UpdateBudgetCategoryInput {
  readonly budgetCategoryId: BudgetCategoryId;
  readonly name?: string;
  readonly outflowType?: BudgetCategoryOutflowType;
  readonly description?: string | null;
  readonly code?: string | null;
}

export interface UpdateBudgetCategoryOutput {
  readonly budgetCategory: BudgetCategory;
}

export class UpdateBudgetCategoryUseCase {
  constructor(
    private readonly unitOfWork: BudgetUnitOfWork,
    private readonly clock: Clock = new SystemClock(),
    private readonly eventIdGenerator: IdGenerator = new CryptoIdGenerator(),
  ) {}

  async execute(context: UpdateBudgetCategoryContext, input: UpdateBudgetCategoryInput): Promise<UpdateBudgetCategoryOutput> {
    requirePermission(context.role, PERMISSIONS.FINANCE_MANAGE);

    const occurredAt = this.clock.now();

    return this.unitOfWork.execute(async (repositories) => {
      const existing = await repositories.budgetCategories.findById(context.organizationId, input.budgetCategoryId);
      if (existing === null) {
        throw new NotFoundError('BudgetCategory', { budgetCategoryId: input.budgetCategoryId });
      }

      const budgetCategory = await repositories.budgetCategories.update(context.organizationId, input.budgetCategoryId, {
        ...(input.name === undefined ? {} : { name: input.name }),
        ...(input.outflowType === undefined ? {} : { outflowType: input.outflowType }),
        ...(input.description === undefined ? {} : { description: input.description }),
        ...(input.code === undefined ? {} : { code: input.code }),
      });

      const audit = new AuditService(repositories.audit, this.clock);
      await audit.record({
        organizationId: context.organizationId,
        actor: { type: 'USER', id: context.userId, userId: context.userId },
        action: 'UPDATE',
        target: { entityType: 'BudgetCategory', entityId: budgetCategory.id },
        request: { requestId: context.requestId, correlationId: context.correlationId },
        before: { id: existing.id, name: existing.name },
        after: { id: budgetCategory.id, name: budgetCategory.name },
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
          type: 'budget_category.updated',
          aggregateType: 'BudgetCategory',
          aggregateId: budgetCategory.id,
          payload: { budgetCategoryId: budgetCategory.id, organizationId: context.organizationId },
          occurredAt,
        },
      });

      return { budgetCategory };
    });
  }
}
