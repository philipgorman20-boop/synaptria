import { AuditService } from '@synaptria/audit';
import {
  CryptoIdGenerator,
  SystemClock,
  type BudgetCategoryId,
  type BudgetId,
  type Clock,
  type CorrelationId,
  type IdGenerator,
  type MembershipId,
  type OrganizationId,
  type ProgramId,
  type ProjectId,
  type RequestId,
  type UserId,
} from '@synaptria/core';
import type { OrganizationRole } from '@synaptria/core/context';
import type { BudgetLine } from '@synaptria/domain/budgets';
import { DomainEventService } from '@synaptria/events';
import { PERMISSIONS, requirePermission } from '@synaptria/permissions';

import { ApplicationError } from '../../shared/application-error';
import type { BudgetUnitOfWork } from './budget-unit-of-work';

export interface CreateBudgetLineContext {
  readonly organizationId: OrganizationId;
  readonly userId: UserId;
  readonly membershipId: MembershipId;
  readonly role: OrganizationRole;
  readonly requestId: RequestId;
  readonly correlationId: CorrelationId;
}

export interface CreateBudgetLineInput {
  readonly budgetId: BudgetId;
  readonly categoryId: BudgetCategoryId;
  readonly programId?: ProgramId;
  readonly projectId?: ProjectId;
  readonly name: string;
  readonly notes?: string;
  readonly plannedAmount?: number;
  readonly actualAmount?: number;
  readonly currency?: string;
  readonly periodStart: Date;
  readonly periodEnd: Date;
}

export interface CreateBudgetLineOutput {
  readonly budgetLine: BudgetLine;
}

export class CreateBudgetLineUseCase {
  constructor(
    private readonly unitOfWork: BudgetUnitOfWork,
    private readonly clock: Clock = new SystemClock(),
    private readonly eventIdGenerator: IdGenerator = new CryptoIdGenerator(),
  ) {}

  async execute(context: CreateBudgetLineContext, input: CreateBudgetLineInput): Promise<CreateBudgetLineOutput> {
    requirePermission(context.role, PERMISSIONS.FINANCE_MANAGE);

    const name = requireText(input.name, 'name');
    const occurredAt = this.clock.now();

    return this.unitOfWork.execute(async (repositories) => {
      const budgetLine = await repositories.budgetLines.create({
        organizationId: context.organizationId,
        budgetId: input.budgetId,
        categoryId: input.categoryId,
        name,
        periodStart: input.periodStart,
        periodEnd: input.periodEnd,
        ...(input.programId === undefined ? {} : { programId: input.programId }),
        ...(input.projectId === undefined ? {} : { projectId: input.projectId }),
        ...(input.notes === undefined ? {} : { notes: input.notes }),
        ...(input.plannedAmount === undefined ? {} : { plannedAmount: input.plannedAmount }),
        ...(input.actualAmount === undefined ? {} : { actualAmount: input.actualAmount }),
        ...(input.currency === undefined ? {} : { currency: input.currency }),
      });

      const audit = new AuditService(repositories.audit, this.clock);
      await audit.record({
        organizationId: context.organizationId,
        actor: { type: 'USER', id: context.userId, userId: context.userId },
        action: 'CREATE',
        target: { entityType: 'BudgetLine', entityId: budgetLine.id },
        request: { requestId: context.requestId, correlationId: context.correlationId },
        after: { id: budgetLine.id, name: budgetLine.name, budgetId: budgetLine.budgetId },
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
          type: 'budget_line.created',
          aggregateType: 'BudgetLine',
          aggregateId: budgetLine.id,
          payload: {
            budgetLineId: budgetLine.id,
            budgetId: budgetLine.budgetId,
            organizationId: context.organizationId,
            name: budgetLine.name,
          },
          occurredAt,
        },
      });

      return { budgetLine };
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
