export interface DeleteVendorActionState {
  readonly status: 'idle' | 'error';
  readonly message?: string;
}

export const initialDeleteVendorState: DeleteVendorActionState = { status: 'idle' };
