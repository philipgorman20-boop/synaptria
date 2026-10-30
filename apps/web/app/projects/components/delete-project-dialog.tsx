'use client';

import type { Project } from '@synaptria/domain/projects';
import { useActionState, useCallback } from 'react';
import { useFormStatus } from 'react-dom';

import { deleteProjectAction } from '../../actions/projects/delete-project';
import { initialDeleteProjectState } from '../../actions/projects/delete-project-form';

const DIALOG_ID = 'delete-project-dialog';

export interface DeleteProjectDialogProps {
  readonly project: Project;
}

export function DeleteProjectDialog({ project }: DeleteProjectDialogProps) {
  const boundAction = useCallback(
    deleteProjectAction.bind(null, project.id),
    [project.id],
  );
  const [state, formAction] = useActionState(boundAction, initialDeleteProjectState);

  const close = () => (globalThis.document.getElementById(DIALOG_ID) as HTMLDialogElement)?.close();
  const open = () => (globalThis.document.getElementById(DIALOG_ID) as HTMLDialogElement)?.showModal();

  return (
    <>
      <button className="danger-button" type="button" onClick={open}>Delete</button>

      <dialog id={DIALOG_ID} className="organization-dialog">
        <form action={formAction} className="organization-form">
          <div className="organization-dialog-heading">
            <div>
              <p className="eyebrow">DELETE PROJECT</p>
              <h2>Delete project?</h2>
            </div>
            <button aria-label="Close dialog" className="dialog-close-button" type="button" onClick={close}>×</button>
          </div>

          <p className="delete-confirm-message">
            Are you sure you want to delete <strong>{project.name}</strong>? This action cannot be undone.
          </p>

          {state.status === 'error' && state.message !== undefined ? (
            <div className="form-error-summary" role="alert">{state.message}</div>
          ) : null}

          <div className="organization-form-actions">
            <button className="secondary-button" type="button" onClick={close}>Cancel</button>
            <DeleteProjectSubmitButton />
          </div>
        </form>
      </dialog>
    </>
  );
}

function DeleteProjectSubmitButton() {
  const { pending } = useFormStatus();
  return (
    <button className="danger-button" type="submit" disabled={pending}>
      {pending ? 'Deleting…' : 'Delete project'}
    </button>
  );
}
