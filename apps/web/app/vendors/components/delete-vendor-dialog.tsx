'use client';

import type { Vendor } from '@synaptria/domain/vendors';
import { useActionState, useCallback } from 'react';
import { useFormStatus } from 'react-dom';

import { deleteVendorAction } from '../../actions/vendors/delete-vendor';
import { initialDeleteVendorState } from '../../actions/vendors/delete-vendor-form';

const DIALOG_ID = 'delete-vendor-dialog';

export interface DeleteVendorDialogProps {
  readonly vendor: Vendor;
}

export function DeleteVendorDialog({ vendor }: DeleteVendorDialogProps) {
  const boundAction = useCallback(
    deleteVendorAction.bind(null, vendor.id),
    [vendor.id],
  );
  const [state, formAction] = useActionState(boundAction, initialDeleteVendorState);

  const close = () => (document.getElementById(DIALOG_ID) as HTMLDialogElement)?.close();
  const open = () => (document.getElementById(DIALOG_ID) as HTMLDialogElement)?.showModal();

  return (
    <>
      <button className="danger-button" type="button" onClick={open}>Delete</button>

      <dialog id={DIALOG_ID} className="organization-dialog">
        <form action={formAction} className="organization-form">
          <div className="organization-dialog-heading">
            <div>
              <p className="eyebrow">DELETE VENDOR</p>
              <h2>Delete vendor?</h2>
            </div>
            <button aria-label="Close dialog" className="dialog-close-button" type="button" onClick={close}>×</button>
          </div>

          <p className="delete-confirm-message">
            Are you sure you want to delete <strong>{vendor.name}</strong>? This action cannot be undone.
          </p>

          {state.status === 'error' && state.message !== undefined ? (
            <div className="form-error-summary" role="alert">{state.message}</div>
          ) : null}

          <div className="organization-form-actions">
            <button className="secondary-button" type="button" onClick={close}>Cancel</button>
            <DeleteVendorSubmitButton />
          </div>
        </form>
      </dialog>
    </>
  );
}

function DeleteVendorSubmitButton() {
  const { pending } = useFormStatus();
  return (
    <button className="danger-button" type="submit" disabled={pending}>
      {pending ? 'Deleting…' : 'Delete vendor'}
    </button>
  );
}
