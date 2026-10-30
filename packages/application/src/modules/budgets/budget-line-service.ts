import type { CreateBudgetLineContext, CreateBudgetLineInput, CreateBudgetLineOutput } from './create-budget-line';
import { CreateBudgetLineUseCase } from './create-budget-line';
import type { UpdateBudgetLineContext, UpdateBudgetLineInput, UpdateBudgetLineOutput } from './update-budget-line';
import { UpdateBudgetLineUseCase } from './update-budget-line';
import type { DeleteBudgetLineContext, DeleteBudgetLineInput, DeleteBudgetLineOutput } from './delete-budget-line';
import { DeleteBudgetLineUseCase } from './delete-budget-line';
import type { ListBudgetLinesContext, ListBudgetLinesInput, ListBudgetLinesOutput } from './list-budget-lines';
import { ListBudgetLinesUseCase } from './list-budget-lines';
import type { ListBudgetCategoriesContext, ListBudgetCategoriesOutput } from './list-budget-categories';
import { ListBudgetCategoriesUseCase } from './list-budget-categories';
import type { ListAllBudgetLinesContext, ListAllBudgetLinesOutput } from './list-all-budget-lines';
import { ListAllBudgetLinesUseCase } from './list-all-budget-lines';
import type { CreateBudgetCategoryContext, CreateBudgetCategoryInput, CreateBudgetCategoryOutput } from './create-budget-category';
import { CreateBudgetCategoryUseCase } from './create-budget-category';
import type { UpdateBudgetCategoryContext, UpdateBudgetCategoryInput, UpdateBudgetCategoryOutput } from './update-budget-category';
import { UpdateBudgetCategoryUseCase } from './update-budget-category';
import type { DeleteBudgetCategoryContext, DeleteBudgetCategoryInput, DeleteBudgetCategoryOutput } from './delete-budget-category';
import { DeleteBudgetCategoryUseCase } from './delete-budget-category';

export class BudgetLineService {
  constructor(
    private readonly createBudgetLineUseCase: CreateBudgetLineUseCase,
    private readonly updateBudgetLineUseCase: UpdateBudgetLineUseCase,
    private readonly deleteBudgetLineUseCase: DeleteBudgetLineUseCase,
    private readonly listBudgetLinesUseCase: ListBudgetLinesUseCase,
    private readonly listBudgetCategoriesUseCase: ListBudgetCategoriesUseCase,
    private readonly listAllBudgetLinesUseCase: ListAllBudgetLinesUseCase,
    private readonly createBudgetCategoryUseCase: CreateBudgetCategoryUseCase,
    private readonly updateBudgetCategoryUseCase: UpdateBudgetCategoryUseCase,
    private readonly deleteBudgetCategoryUseCase: DeleteBudgetCategoryUseCase,
  ) {}

  createBudgetLine(context: CreateBudgetLineContext, input: CreateBudgetLineInput): Promise<CreateBudgetLineOutput> {
    return this.createBudgetLineUseCase.execute(context, input);
  }

  updateBudgetLine(context: UpdateBudgetLineContext, input: UpdateBudgetLineInput): Promise<UpdateBudgetLineOutput> {
    return this.updateBudgetLineUseCase.execute(context, input);
  }

  deleteBudgetLine(context: DeleteBudgetLineContext, input: DeleteBudgetLineInput): Promise<DeleteBudgetLineOutput> {
    return this.deleteBudgetLineUseCase.execute(context, input);
  }

  listBudgetLines(context: ListBudgetLinesContext, input: ListBudgetLinesInput): Promise<ListBudgetLinesOutput> {
    return this.listBudgetLinesUseCase.execute(context, input);
  }

  listBudgetCategories(context: ListBudgetCategoriesContext): Promise<ListBudgetCategoriesOutput> {
    return this.listBudgetCategoriesUseCase.execute(context);
  }

  listAllBudgetLines(context: ListAllBudgetLinesContext): Promise<ListAllBudgetLinesOutput> {
    return this.listAllBudgetLinesUseCase.execute(context);
  }

  createBudgetCategory(context: CreateBudgetCategoryContext, input: CreateBudgetCategoryInput): Promise<CreateBudgetCategoryOutput> {
    return this.createBudgetCategoryUseCase.execute(context, input);
  }

  updateBudgetCategory(context: UpdateBudgetCategoryContext, input: UpdateBudgetCategoryInput): Promise<UpdateBudgetCategoryOutput> {
    return this.updateBudgetCategoryUseCase.execute(context, input);
  }

  deleteBudgetCategory(context: DeleteBudgetCategoryContext, input: DeleteBudgetCategoryInput): Promise<DeleteBudgetCategoryOutput> {
    return this.deleteBudgetCategoryUseCase.execute(context, input);
  }
}
