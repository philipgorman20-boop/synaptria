import type { OrganizationId } from '@synaptria/core';
import type { OrganizationRole } from '@synaptria/core/context';
import type { BudgetCategory, BudgetCategoryRepository } from '@synaptria/domain/budgets';
import { PERMISSIONS, requirePermission } from '@synaptria/permissions';

export interface ListBudgetCategoriesContext {
  readonly organizationId: OrganizationId;
  readonly role: OrganizationRole;
}

export interface ListBudgetCategoriesOutput {
  readonly budgetCategories: readonly BudgetCategory[];
}

export class ListBudgetCategoriesUseCase {
  constructor(private readonly budgetCategoryRepository: BudgetCategoryRepository) {}

  async execute(context: ListBudgetCategoriesContext): Promise<ListBudgetCategoriesOutput> {
    requirePermission(context.role, PERMISSIONS.FINANCE_MANAGE);

    const budgetCategories = await this.budgetCategoryRepository.listForOrganization(context.organizationId);
    return { budgetCategories };
  }
}
