export interface DeleteRiskActionState {
  readonly status: 'idle' | 'error';
  readonly message?: string;
}

export const initialDeleteRiskState: DeleteRiskActionState = { status: 'idle' };
