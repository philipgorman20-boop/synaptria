'use client';

import type { Risk } from '@synaptria/domain/risks';
import { useActionState, useCallback } from 'react';
import { useFormStatus } from 'react-dom';

import { deleteRiskAction } from '../../actions/risks/delete-risk';
import { initialDeleteRiskState } from '../../actions/risks/delete-risk-form';

const DIALOG_ID = 'delete-risk-dialog';

export interface DeleteRiskDialogProps {
  readonly risk: Risk;
}

export function DeleteRiskDialog({ risk }: DeleteRiskDialogProps) {
  const boundAction = useCallback(
    deleteRiskAction.bind(null, risk.id),
    [risk.id],
  );
  const [state, formAction] = useActionState(boundAction, initialDeleteRiskState);

  const close = () => (document.getElementById(DIALOG_ID) as HTMLDialogElement)?.close();
  const open = () => (document.getElementById(DIALOG_ID) as HTMLDialogElement)?.showModal();

  return (
    <>
      <button className="danger-button" type="button" onClick={open}>Delete</button>

      <dialog id={DIALOG_ID} className="organization-dialog">
        <form action={formAction} className="organization-form">
          <div className="organization-dialog-heading">
            <div>
              <p className="eyebrow">DELETE RISK</p>
              <h2>Delete risk?</h2>
            </div>
            <button aria-label="Close dialog" className="dialog-close-button" type="button" onClick={close}>×</button>
          </div>

          <p className="delete-confirm-message">
            Are you sure you want to delete <strong>{risk.title}</strong>? This action cannot be undone.
          </p>

          {state.status === 'error' && state.message !== undefined ? (
            <div className="form-error-summary" role="alert">{state.message}</div>
          ) : null}

          <div className="organization-form-actions">
            <button className="secondary-button" type="button" onClick={close}>Cancel</button>
            <DeleteRiskSubmitButton />
          </div>
        </form>
      </dialog>
    </>
  );
}

function DeleteRiskSubmitButton() {
  const { pending } = useFormStatus();
  return (
    <button className="danger-button" type="submit" disabled={pending}>
      {pending ? 'Deleting…' : 'Delete risk'}
    </button>
  );
}
