export interface DeleteBudgetActionState {
  readonly status: 'idle' | 'error';
  readonly message?: string;
}

export const initialDeleteBudgetState: DeleteBudgetActionState = { status: 'idle' };
