import type { AuditRepository } from '@synaptria/audit';
import type { BudgetCategoryRepository, BudgetLineRepository, BudgetRepository, FundingEventRepository } from '@synaptria/domain/budgets';
import type { EventRepository } from '@synaptria/events';

export interface BudgetTransactionRepositories {
  readonly budgets: BudgetRepository;
  readonly budgetLines: BudgetLineRepository;
  readonly budgetCategories: BudgetCategoryRepository;
  readonly fundingEvents: FundingEventRepository;
  readonly audit: AuditRepository;
  readonly events: EventRepository;
}

export interface BudgetUnitOfWork {
  execute<T>(
    operation: (repositories: BudgetTransactionRepositories) => Promise<T>,
  ): Promise<T>;
}
