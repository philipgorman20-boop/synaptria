export interface DeleteDecisionActionState {
  readonly status: 'idle' | 'error';
  readonly message?: string;
}

export const initialDeleteDecisionState: DeleteDecisionActionState = { status: 'idle' };
