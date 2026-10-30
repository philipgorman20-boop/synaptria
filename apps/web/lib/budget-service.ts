import {
  BudgetLineService,
  BudgetService,
  CreateBudgetCategoryUseCase,
  CreateBudgetLineUseCase,
  CreateBudgetUseCase,
  CreateFundingEventUseCase,
  DeleteBudgetCategoryUseCase,
  DeleteBudgetLineUseCase,
  DeleteBudgetUseCase,
  DeleteFundingEventUseCase,
  FundingEventService,
  GetBudgetUseCase,
  ListAllBudgetLinesUseCase,
  ListBudgetCategoriesUseCase,
  ListBudgetLinesUseCase,
  ListBudgetsUseCase,
  ListFundingEventsUseCase,
  UpdateBudgetCategoryUseCase,
  UpdateBudgetLineUseCase,
  UpdateBudgetUseCase,
  UpdateFundingEventUseCase,
  type BudgetTransactionRepositories,
  type BudgetUnitOfWork,
} from '@synaptria/application';
import {
  createPersistenceRepositories,
  db,
  withDatabaseTransaction,
} from '@synaptria/database';

class PrismaBudgetUnitOfWork implements BudgetUnitOfWork {
  async execute<T>(
    operation: (repositories: BudgetTransactionRepositories) => Promise<T>,
  ): Promise<T> {
    return withDatabaseTransaction(db, async (repositories) =>
      operation({
        budgets: repositories.budgets,
        budgetLines: repositories.budgetLines,
        budgetCategories: repositories.budgetCategories,
        fundingEvents: repositories.fundingEvents,
        audit: repositories.audit,
        events: repositories.events,
      }),
    );
  }
}

const repositories = createPersistenceRepositories(db);
const budgetUnitOfWork = new PrismaBudgetUnitOfWork();

const budgetService = new BudgetService(
  new CreateBudgetUseCase(budgetUnitOfWork),
  new ListBudgetsUseCase(repositories.budgets),
  new GetBudgetUseCase(repositories.budgets),
  new UpdateBudgetUseCase(budgetUnitOfWork),
  new DeleteBudgetUseCase(budgetUnitOfWork),
);

const budgetLineService = new BudgetLineService(
  new CreateBudgetLineUseCase(budgetUnitOfWork),
  new UpdateBudgetLineUseCase(budgetUnitOfWork),
  new DeleteBudgetLineUseCase(budgetUnitOfWork),
  new ListBudgetLinesUseCase(repositories.budgetLines),
  new ListBudgetCategoriesUseCase(repositories.budgetCategories),
  new ListAllBudgetLinesUseCase(repositories.budgetLines),
  new CreateBudgetCategoryUseCase(budgetUnitOfWork),
  new UpdateBudgetCategoryUseCase(budgetUnitOfWork),
  new DeleteBudgetCategoryUseCase(budgetUnitOfWork),
);

const fundingEventService = new FundingEventService(
  new CreateFundingEventUseCase(budgetUnitOfWork),
  new UpdateFundingEventUseCase(budgetUnitOfWork),
  new DeleteFundingEventUseCase(budgetUnitOfWork),
  new ListFundingEventsUseCase(repositories.fundingEvents),
);

export function getBudgetService(): BudgetService {
  return budgetService;
}

export function getBudgetLineService(): BudgetLineService {
  return budgetLineService;
}

export function getFundingEventService(): FundingEventService {
  return fundingEventService;
}
