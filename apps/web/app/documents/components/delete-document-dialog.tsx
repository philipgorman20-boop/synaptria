'use client';

import type { Document } from '@synaptria/domain/documents';
import { useActionState, useCallback } from 'react';
import { useFormStatus } from 'react-dom';

import { deleteDocumentAction } from '../../actions/documents/delete-document';
import { initialDeleteDocumentState } from '../../actions/documents/delete-document-form';

const DIALOG_ID = 'delete-document-dialog';

export interface DeleteDocumentDialogProps {
  readonly document: Document;
}

export function DeleteDocumentDialog({ document: doc }: DeleteDocumentDialogProps) {
  const boundAction = useCallback(
    deleteDocumentAction.bind(null, doc.id),
    [doc.id],
  );
  const [state, formAction] = useActionState(boundAction, initialDeleteDocumentState);

  const close = () => (globalThis.document.getElementById(DIALOG_ID) as HTMLDialogElement)?.close();
  const open = () => (globalThis.document.getElementById(DIALOG_ID) as HTMLDialogElement)?.showModal();

  return (
    <>
      <button className="danger-button" type="button" onClick={open}>Delete</button>

      <dialog id={DIALOG_ID} className="organization-dialog">
        <form action={formAction} className="organization-form">
          <div className="organization-dialog-heading">
            <div>
              <p className="eyebrow">DELETE DOCUMENT</p>
              <h2>Delete document?</h2>
            </div>
            <button aria-label="Close dialog" className="dialog-close-button" type="button" onClick={close}>×</button>
          </div>

          <p className="delete-confirm-message">
            Are you sure you want to delete <strong>{doc.title}</strong>? This action cannot be undone.
          </p>

          {state.status === 'error' && state.message !== undefined ? (
            <div className="form-error-summary" role="alert">{state.message}</div>
          ) : null}

          <div className="organization-form-actions">
            <button className="secondary-button" type="button" onClick={close}>Cancel</button>
            <DeleteDocumentSubmitButton />
          </div>
        </form>
      </dialog>
    </>
  );
}

function DeleteDocumentSubmitButton() {
  const { pending } = useFormStatus();
  return (
    <button className="danger-button" type="submit" disabled={pending}>
      {pending ? 'Deleting…' : 'Delete document'}
    </button>
  );
}
