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
import type { BudgetCategory, BudgetCategoryOutflowType } from '@synaptria/domain/budgets';
import { DomainEventService } from '@synaptria/events';
import { PERMISSIONS, requirePermission } from '@synaptria/permissions';

import { ApplicationError } from '../../shared/application-error';
import type { BudgetUnitOfWork } from './budget-unit-of-work';

export interface CreateBudgetCategoryContext {
  readonly organizationId: OrganizationId;
  readonly userId: UserId;
  readonly membershipId: MembershipId;
  readonly role: OrganizationRole;
  readonly requestId: RequestId;
  readonly correlationId: CorrelationId;
}

export interface CreateBudgetCategoryInput {
  readonly name: string;
  readonly outflowType?: BudgetCategoryOutflowType;
  readonly description?: string;
  readonly code?: string;
}

export interface CreateBudgetCategoryOutput {
  readonly budgetCategory: BudgetCategory;
}

export class CreateBudgetCategoryUseCase {
  constructor(
    private readonly unitOfWork: BudgetUnitOfWork,
    private readonly clock: Clock = new SystemClock(),
    private readonly eventIdGenerator: IdGenerator = new CryptoIdGenerator(),
  ) {}

  async execute(context: CreateBudgetCategoryContext, input: CreateBudgetCategoryInput): Promise<CreateBudgetCategoryOutput> {
    requirePermission(context.role, PERMISSIONS.FINANCE_MANAGE);

    const name = requireText(input.name, 'name');
    const occurredAt = this.clock.now();

    return this.unitOfWork.execute(async (repositories) => {
      const budgetCategory = await repositories.budgetCategories.create({
        organizationId: context.organizationId,
        name,
        ...(input.outflowType === undefined ? {} : { outflowType: input.outflowType }),
        ...(input.description === undefined ? {} : { description: input.description }),
        ...(input.code === undefined ? {} : { code: input.code }),
      });

      const audit = new AuditService(repositories.audit, this.clock);
      await audit.record({
        organizationId: context.organizationId,
        actor: { type: 'USER', id: context.userId, userId: context.userId },
        action: 'CREATE',
        target: { entityType: 'BudgetCategory', entityId: budgetCategory.id },
        request: { requestId: context.requestId, correlationId: context.correlationId },
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
          type: 'budget_category.created',
          aggregateType: 'BudgetCategory',
          aggregateId: budgetCategory.id,
          payload: { budgetCategoryId: budgetCategory.id, organizationId: context.organizationId, name: budgetCategory.name },
          occurredAt,
        },
      });

      return { budgetCategory };
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
