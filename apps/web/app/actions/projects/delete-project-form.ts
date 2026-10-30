export interface DeleteProjectActionState {
  readonly status: 'idle' | 'error';
  readonly message?: string;
}

export const initialDeleteProjectState: DeleteProjectActionState = { status: 'idle' };
