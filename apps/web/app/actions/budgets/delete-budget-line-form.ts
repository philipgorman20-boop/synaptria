export interface DeleteBudgetLineActionState {
  readonly status: 'idle' | 'error';
  readonly message?: string;
}

export const initialDeleteBudgetLineState: DeleteBudgetLineActionState = { status: 'idle' };
