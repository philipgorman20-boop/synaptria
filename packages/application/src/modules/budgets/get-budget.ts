import type { BudgetId, OrganizationId } from '@synaptria/core';
import type { OrganizationRole } from '@synaptria/core/context';
import type { Budget, BudgetRepository } from '@synaptria/domain/budgets';
import { PERMISSIONS, requirePermission } from '@synaptria/permissions';

import { ApplicationError } from '../../shared/application-error';

export interface GetBudgetContext {
  readonly organizationId: OrganizationId;
  readonly role: OrganizationRole;
}

export interface GetBudgetInput {
  readonly budgetId: BudgetId;
}

export interface GetBudgetOutput {
  readonly budget: Budget;
}

export class GetBudgetUseCase {
  constructor(private readonly budgets: BudgetRepository) {}

  async execute(context: GetBudgetContext, input: GetBudgetInput): Promise<GetBudgetOutput> {
    requirePermission(context.role, PERMISSIONS.FINANCE_READ);

    const budget = await this.budgets.findById(context.organizationId, input.budgetId);

    if (budget === null || budget.deletedAt !== undefined) {
      throw new ApplicationError({
        code: 'NOT_FOUND',
        message: 'Budget not found.',
        details: { budgetId: input.budgetId },
      });
    }

    return { budget };
  }
}
