export interface DeleteProgramActionState {
  readonly status: 'idle' | 'error';
  readonly message?: string;
}

export const initialDeleteProgramState: DeleteProgramActionState = { status: 'idle' };
