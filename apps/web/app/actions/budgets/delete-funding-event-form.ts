export interface DeleteFundingEventActionState {
  readonly status: 'idle' | 'error';
  readonly message?: string;
}

export const initialDeleteFundingEventState: DeleteFundingEventActionState = { status: 'idle' };
