import type { OrganizationId } from '@synaptria/core';
import type { OrganizationRole } from '@synaptria/core/context';
import type { Budget, BudgetRepository } from '@synaptria/domain/budgets';
import { PERMISSIONS, requirePermission } from '@synaptria/permissions';

export interface ListBudgetsContext {
  readonly organizationId: OrganizationId;
  readonly role: OrganizationRole;
}

export interface ListBudgetsOutput {
  readonly budgets: readonly Budget[];
}

export class ListBudgetsUseCase {
  constructor(private readonly budgets: BudgetRepository) {}

  async execute(context: ListBudgetsContext): Promise<ListBudgetsOutput> {
    requirePermission(context.role, PERMISSIONS.FINANCE_READ);

    const budgets = await this.budgets.listForOrganization(context.organizationId);

    return { budgets: budgets.filter((b) => b.deletedAt === undefined) };
  }
}
