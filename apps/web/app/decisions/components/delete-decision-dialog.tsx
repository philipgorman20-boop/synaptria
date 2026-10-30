'use client';

import type { Decision } from '@synaptria/domain/decisions';
import { useActionState, useCallback } from 'react';
import { useFormStatus } from 'react-dom';

import { deleteDecisionAction } from '../../actions/decisions/delete-decision';
import { initialDeleteDecisionState } from '../../actions/decisions/delete-decision-form';

const DIALOG_ID = 'delete-decision-dialog';

export interface DeleteDecisionDialogProps {
  readonly decision: Decision;
}

export function DeleteDecisionDialog({ decision }: DeleteDecisionDialogProps) {
  const boundAction = useCallback(
    deleteDecisionAction.bind(null, decision.id),
    [decision.id],
  );
  const [state, formAction] = useActionState(boundAction, initialDeleteDecisionState);

  const close = () => (document.getElementById(DIALOG_ID) as HTMLDialogElement)?.close();
  const open = () => (document.getElementById(DIALOG_ID) as HTMLDialogElement)?.showModal();

  return (
    <>
      <button className="danger-button" type="button" onClick={open}>Delete</button>

      <dialog id={DIALOG_ID} className="organization-dialog">
        <form action={formAction} className="organization-form">
          <div className="organization-dialog-heading">
            <div>
              <p className="eyebrow">DELETE DECISION</p>
              <h2>Delete decision?</h2>
            </div>
            <button aria-label="Close dialog" className="dialog-close-button" type="button" onClick={close}>×</button>
          </div>

          <p className="delete-confirm-message">
            Are you sure you want to delete <strong>{decision.title}</strong>? This action cannot be undone.
          </p>

          {state.status === 'error' && state.message !== undefined ? (
            <div className="form-error-summary" role="alert">{state.message}</div>
          ) : null}

          <div className="organization-form-actions">
            <button className="secondary-button" type="button" onClick={close}>Cancel</button>
            <DeleteDecisionSubmitButton />
          </div>
        </form>
      </dialog>
    </>
  );
}

function DeleteDecisionSubmitButton() {
  const { pending } = useFormStatus();
  return (
    <button className="danger-button" type="submit" disabled={pending}>
      {pending ? 'Deleting…' : 'Delete decision'}
    </button>
  );
}
