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
import type {
  Budget,
  BudgetPeriodType,
  BudgetStatus,
  CreateBudgetInput as RepositoryCreateBudgetInput,
} from '@synaptria/domain/budgets';
import { DomainEventService } from '@synaptria/events';
import { PERMISSIONS, requirePermission } from '@synaptria/permissions';

import { ApplicationError } from '../../shared/application-error';
import type { BudgetUnitOfWork } from './budget-unit-of-work';

export interface CreateBudgetContext {
  readonly organizationId: OrganizationId;
  readonly userId: UserId;
  readonly membershipId: MembershipId;
  readonly role: OrganizationRole;
  readonly requestId: RequestId;
  readonly correlationId: CorrelationId;
}

export interface CreateBudgetInput {
  readonly name: string;
  readonly description?: string;
  readonly status?: BudgetStatus;
  readonly periodType?: BudgetPeriodType;
  readonly currency?: string;
  readonly startDate: Date;
  readonly endDate: Date;
}

export interface CreateBudgetOutput {
  readonly budget: Budget;
}

export class CreateBudgetUseCase {
  constructor(
    private readonly unitOfWork: BudgetUnitOfWork,
    private readonly clock: Clock = new SystemClock(),
    private readonly eventIdGenerator: IdGenerator = new CryptoIdGenerator(),
  ) {}

  async execute(context: CreateBudgetContext, input: CreateBudgetInput): Promise<CreateBudgetOutput> {
    requirePermission(context.role, PERMISSIONS.FINANCE_MANAGE);

    const name = requireText(input.name, 'name');
    const occurredAt = this.clock.now();

    return this.unitOfWork.execute(async (repositories) => {
      const repositoryInput: RepositoryCreateBudgetInput = {
        organizationId: context.organizationId,
        name,
        startDate: input.startDate,
        endDate: input.endDate,
        ...(input.description === undefined ? {} : { description: input.description }),
        ...(input.status === undefined ? {} : { status: input.status }),
        ...(input.periodType === undefined ? {} : { periodType: input.periodType }),
        ...(input.currency === undefined ? {} : { currency: input.currency }),
      };

      const budget = await repositories.budgets.create(repositoryInput);

      const audit = new AuditService(repositories.audit, this.clock);
      await audit.record({
        organizationId: context.organizationId,
        actor: { type: 'USER', id: context.userId, userId: context.userId },
        action: 'CREATE',
        target: { entityType: 'Budget', entityId: budget.id },
        request: { requestId: context.requestId, correlationId: context.correlationId },
        after: { id: budget.id, name: budget.name, status: budget.status, periodType: budget.periodType },
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
          type: 'budget.created',
          aggregateType: 'Budget',
          aggregateId: budget.id,
          payload: {
            budgetId: budget.id,
            organizationId: context.organizationId,
            name: budget.name,
            status: budget.status,
            periodType: budget.periodType,
          },
          occurredAt,
        },
      });

      return { budget };
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
