'use client';

import type { Program } from '@synaptria/domain/programs';
import { useActionState, useCallback } from 'react';
import { useFormStatus } from 'react-dom';

import { deleteProgramAction } from '../../actions/programs/delete-program';
import { initialDeleteProgramState } from '../../actions/programs/delete-program-form';

const DIALOG_ID = 'delete-program-dialog';

export interface DeleteProgramDialogProps {
  readonly program: Program;
}

export function DeleteProgramDialog({ program }: DeleteProgramDialogProps) {
  const boundAction = useCallback(
    deleteProgramAction.bind(null, program.id),
    [program.id],
  );
  const [state, formAction] = useActionState(boundAction, initialDeleteProgramState);

  const close = () => (globalThis.document.getElementById(DIALOG_ID) as HTMLDialogElement)?.close();
  const open = () => (globalThis.document.getElementById(DIALOG_ID) as HTMLDialogElement)?.showModal();

  return (
    <>
      <button className="danger-button" type="button" onClick={open}>Delete</button>

      <dialog id={DIALOG_ID} className="organization-dialog">
        <form action={formAction} className="organization-form">
          <div className="organization-dialog-heading">
            <div>
              <p className="eyebrow">DELETE PROGRAM</p>
              <h2>Delete program?</h2>
            </div>
            <button aria-label="Close dialog" className="dialog-close-button" type="button" onClick={close}>×</button>
          </div>

          <p className="delete-confirm-message">
            Are you sure you want to delete <strong>{program.name}</strong>? This action cannot be undone.
          </p>

          {state.status === 'error' && state.message !== undefined ? (
            <div className="form-error-summary" role="alert">{state.message}</div>
          ) : null}

          <div className="organization-form-actions">
            <button className="secondary-button" type="button" onClick={close}>Cancel</button>
            <DeleteProgramSubmitButton />
          </div>
        </form>
      </dialog>
    </>
  );
}

function DeleteProgramSubmitButton() {
  const { pending } = useFormStatus();
  return (
    <button className="danger-button" type="submit" disabled={pending}>
      {pending ? 'Deleting…' : 'Delete program'}
    </button>
  );
}
