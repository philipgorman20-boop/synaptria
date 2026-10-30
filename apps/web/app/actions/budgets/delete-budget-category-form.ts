export interface DeleteBudgetCategoryActionState {
  readonly status: 'idle' | 'error' | 'success';
  readonly message?: string;
}

export const initialDeleteBudgetCategoryState: DeleteBudgetCategoryActionState = { status: 'idle' };
