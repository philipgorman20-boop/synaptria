import type { OrganizationId } from '@synaptria/core';
import type { OrganizationRole } from '@synaptria/core/context';
import type { BudgetLine, BudgetLineRepository } from '@synaptria/domain/budgets';
import { PERMISSIONS, requirePermission } from '@synaptria/permissions';

export interface ListAllBudgetLinesContext {
  readonly organizationId: OrganizationId;
  readonly role: OrganizationRole;
}

export interface ListAllBudgetLinesOutput {
  readonly budgetLines: readonly BudgetLine[];
}

export class ListAllBudgetLinesUseCase {
  constructor(private readonly budgetLineRepository: BudgetLineRepository) {}

  async execute(context: ListAllBudgetLinesContext): Promise<ListAllBudgetLinesOutput> {
    requirePermission(context.role, PERMISSIONS.FINANCE_MANAGE);

    const budgetLines = await this.budgetLineRepository.listForOrganization(context.organizationId);
    return { budgetLines };
  }
}
