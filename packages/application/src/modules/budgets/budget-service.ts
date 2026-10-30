import type { CreateBudgetContext, CreateBudgetInput, CreateBudgetOutput } from './create-budget';
import { CreateBudgetUseCase } from './create-budget';
import type { GetBudgetContext, GetBudgetInput, GetBudgetOutput } from './get-budget';
import { GetBudgetUseCase } from './get-budget';
import type { ListBudgetsContext, ListBudgetsOutput } from './list-budgets';
import { ListBudgetsUseCase } from './list-budgets';
import type { UpdateBudgetContext, UpdateBudgetInput, UpdateBudgetOutput } from './update-budget';
import { UpdateBudgetUseCase } from './update-budget';
import type { DeleteBudgetContext, DeleteBudgetInput, DeleteBudgetOutput } from './delete-budget';
import { DeleteBudgetUseCase } from './delete-budget';

export class BudgetService {
  constructor(
    private readonly createBudgetUseCase: CreateBudgetUseCase,
    private readonly listBudgetsUseCase: ListBudgetsUseCase,
    private readonly getBudgetUseCase: GetBudgetUseCase,
    private readonly updateBudgetUseCase: UpdateBudgetUseCase,
    private readonly deleteBudgetUseCase: DeleteBudgetUseCase,
  ) {}

  createBudget(context: CreateBudgetContext, input: CreateBudgetInput): Promise<CreateBudgetOutput> {
    return this.createBudgetUseCase.execute(context, input);
  }

  listBudgets(context: ListBudgetsContext): Promise<ListBudgetsOutput> {
    return this.listBudgetsUseCase.execute(context);
  }

  getBudget(context: GetBudgetContext, input: GetBudgetInput): Promise<GetBudgetOutput> {
    return this.getBudgetUseCase.execute(context, input);
  }

  updateBudget(context: UpdateBudgetContext, input: UpdateBudgetInput): Promise<UpdateBudgetOutput> {
    return this.updateBudgetUseCase.execute(context, input);
  }

  deleteBudget(context: DeleteBudgetContext, input: DeleteBudgetInput): Promise<DeleteBudgetOutput> {
    return this.deleteBudgetUseCase.execute(context, input);
  }
}
