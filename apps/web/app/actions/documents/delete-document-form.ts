export interface DeleteDocumentActionState {
  readonly status: 'idle' | 'error';
  readonly message?: string;
}

export const initialDeleteDocumentState: DeleteDocumentActionState = { status: 'idle' };
