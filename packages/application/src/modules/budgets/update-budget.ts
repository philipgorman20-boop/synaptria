import { AuditService } from '@synaptria/audit';
import {
  CryptoIdGenerator,
  SystemClock,
  type BudgetId,
  type Clock,
  type CorrelationId,
  type IdGenerator,
  type MembershipId,
  type OrganizationId,
  type RequestId,
  type UserId,
} from '@synaptria/core';
import type { OrganizationRole } from '@synaptria/core/context';
import type {
  Budget,
  BudgetPeriodType,
  BudgetStatus,
  UpdateBudgetInput as RepositoryUpdateBudgetInput,
} from '@synaptria/domain/budgets';
import { DomainEventService } from '@synaptria/events';
import { PERMISSIONS, requirePermission } from '@synaptria/permissions';

import { ApplicationError } from '../../shared/application-error';
import type { BudgetUnitOfWork } from './budget-unit-of-work';

export interface UpdateBudgetContext {
  readonly organizationId: OrganizationId;
  readonly userId: UserId;
  readonly membershipId: MembershipId;
  readonly role: OrganizationRole;
  readonly requestId: RequestId;
  readonly correlationId: CorrelationId;
}

export interface UpdateBudgetInput {
  readonly budgetId: BudgetId;
  readonly name?: string;
  readonly description?: string;
  readonly status?: BudgetStatus;
  readonly periodType?: BudgetPeriodType;
  readonly currency?: string;
  readonly startDate?: Date;
  readonly endDate?: Date;
}

export interface UpdateBudgetOutput {
  readonly budget: Budget;
}

export class UpdateBudgetUseCase {
  constructor(
    private readonly unitOfWork: BudgetUnitOfWork,
    private readonly clock: Clock = new SystemClock(),
    private readonly eventIdGenerator: IdGenerator = new CryptoIdGenerator(),
  ) {}

  async execute(context: UpdateBudgetContext, input: UpdateBudgetInput): Promise<UpdateBudgetOutput> {
    requirePermission(context.role, PERMISSIONS.FINANCE_MANAGE);

    const repositoryInput: RepositoryUpdateBudgetInput = {};

    if (input.name !== undefined) {
      const name = input.name.trim();
      if (name.length === 0) {
        throw new ApplicationError({ code: 'VALIDATION_FAILED', message: 'name cannot be empty.', details: { field: 'name' } });
      }
      (repositoryInput as Record<string, unknown>).name = name;
    }

    if (input.description !== undefined) (repositoryInput as Record<string, unknown>).description = input.description;
    if (input.status !== undefined) (repositoryInput as Record<string, unknown>).status = input.status;
    if (input.periodType !== undefined) (repositoryInput as Record<string, unknown>).periodType = input.periodType;
    if (input.currency !== undefined) (repositoryInput as Record<string, unknown>).currency = input.currency;
    if (input.startDate !== undefined) (repositoryInput as Record<string, unknown>).startDate = input.startDate;
    if (input.endDate !== undefined) (repositoryInput as Record<string, unknown>).endDate = input.endDate;

    const occurredAt = this.clock.now();

    return this.unitOfWork.execute(async (repositories) => {
      const existing = await repositories.budgets.findById(context.organizationId, input.budgetId);
      if (existing === null || existing.deletedAt !== undefined) {
        throw new ApplicationError({ code: 'NOT_FOUND', message: 'Budget not found.', details: { field: 'budgetId' } });
      }

      const budget = await repositories.budgets.update(context.organizationId, input.budgetId, repositoryInput);

      const audit = new AuditService(repositories.audit, this.clock);
      await audit.record({
        organizationId: context.organizationId,
        actor: { type: 'USER', id: context.userId, userId: context.userId },
        action: 'UPDATE',
        target: { entityType: 'Budget', entityId: budget.id },
        request: { requestId: context.requestId, correlationId: context.correlationId },
        before: { id: existing.id, name: existing.name, status: existing.status },
        after: { id: budget.id, name: budget.name, status: budget.status },
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
          type: 'budget.updated',
          aggregateType: 'Budget',
          aggregateId: budget.id,
          payload: {
            budgetId: budget.id,
            organizationId: context.organizationId,
            name: budget.name,
            status: budget.status,
            updatedByUserId: context.userId,
          },
          occurredAt,
        },
      });

      return { budget };
    });
  }
}
