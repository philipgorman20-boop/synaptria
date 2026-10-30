import { AuditService } from '@synaptria/audit';
import {
  CryptoIdGenerator,
  SystemClock,
  type BudgetCategoryId,
  type BudgetLineId,
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
import { NotFoundError } from '@synaptria/core/errors';
import type { BudgetUnitOfWork } from './budget-unit-of-work';

export interface UpdateBudgetLineContext {
  readonly organizationId: OrganizationId;
  readonly userId: UserId;
  readonly membershipId: MembershipId;
  readonly role: OrganizationRole;
  readonly requestId: RequestId;
  readonly correlationId: CorrelationId;
}

export interface UpdateBudgetLineInput {
  readonly budgetLineId: BudgetLineId;
  readonly categoryId?: BudgetCategoryId;
  readonly programId?: ProgramId | null;
  readonly projectId?: ProjectId | null;
  readonly name?: string;
  readonly notes?: string | null;
  readonly plannedAmount?: number;
  readonly actualAmount?: number;
  readonly currency?: string;
  readonly periodStart?: Date;
  readonly periodEnd?: Date;
}

export interface UpdateBudgetLineOutput {
  readonly budgetLine: BudgetLine;
}

export class UpdateBudgetLineUseCase {
  constructor(
    private readonly unitOfWork: BudgetUnitOfWork,
    private readonly clock: Clock = new SystemClock(),
    private readonly eventIdGenerator: IdGenerator = new CryptoIdGenerator(),
  ) {}

  async execute(context: UpdateBudgetLineContext, input: UpdateBudgetLineInput): Promise<UpdateBudgetLineOutput> {
    requirePermission(context.role, PERMISSIONS.FINANCE_MANAGE);

    const occurredAt = this.clock.now();

    return this.unitOfWork.execute(async (repositories) => {
      const existing = await repositories.budgetLines.findById(context.organizationId, input.budgetLineId);
      if (existing === null) {
        throw new NotFoundError('BudgetLine', { budgetLineId: input.budgetLineId });
      }

      const repositoryInput: import('@synaptria/domain/budgets').UpdateBudgetLineInput = {
        ...(input.categoryId === undefined ? {} : { categoryId: input.categoryId }),
        ...(input.name === undefined ? {} : { name: input.name }),
        ...(input.notes === undefined ? {} : { notes: input.notes }),
        ...(input.plannedAmount === undefined ? {} : { plannedAmount: input.plannedAmount }),
        ...(input.actualAmount === undefined ? {} : { actualAmount: input.actualAmount }),
        ...(input.currency === undefined ? {} : { currency: input.currency }),
        ...(input.periodStart === undefined ? {} : { periodStart: input.periodStart }),
        ...(input.periodEnd === undefined ? {} : { periodEnd: input.periodEnd }),
        ...(input.programId === undefined ? {} : { programId: input.programId }),
        ...(input.projectId === undefined ? {} : { projectId: input.projectId }),
      };

      const budgetLine = await repositories.budgetLines.update(context.organizationId, input.budgetLineId, repositoryInput);

      const audit = new AuditService(repositories.audit, this.clock);
      await audit.record({
        organizationId: context.organizationId,
        actor: { type: 'USER', id: context.userId, userId: context.userId },
        action: 'UPDATE',
        target: { entityType: 'BudgetLine', entityId: budgetLine.id },
        request: { requestId: context.requestId, correlationId: context.correlationId },
        before: { id: existing.id, name: existing.name },
        after: { id: budgetLine.id, name: budgetLine.name },
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
          type: 'budget_line.updated',
          aggregateType: 'BudgetLine',
          aggregateId: budgetLine.id,
          payload: { budgetLineId: budgetLine.id, organizationId: context.organizationId },
          occurredAt,
        },
      });

      return { budgetLine };
    });
  }
}
