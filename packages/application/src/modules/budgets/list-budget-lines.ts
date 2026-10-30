import type { BudgetId, OrganizationId } from '@synaptria/core';
import type { OrganizationRole } from '@synaptria/core/context';
import type { BudgetLine, BudgetLineRepository } from '@synaptria/domain/budgets';
import { PERMISSIONS, requirePermission } from '@synaptria/permissions';

export interface ListBudgetLinesContext {
  readonly organizationId: OrganizationId;
  readonly role: OrganizationRole;
}

export interface ListBudgetLinesInput {
  readonly budgetId: BudgetId;
}

export interface ListBudgetLinesOutput {
  readonly budgetLines: readonly BudgetLine[];
}

export class ListBudgetLinesUseCase {
  constructor(private readonly budgetLineRepository: BudgetLineRepository) {}

  async execute(context: ListBudgetLinesContext, input: ListBudgetLinesInput): Promise<ListBudgetLinesOutput> {
    requirePermission(context.role, PERMISSIONS.FINANCE_MANAGE);

    const budgetLines = await this.budgetLineRepository.listForBudget(context.organizationId, input.budgetId);
    return { budgetLines };
  }
}
