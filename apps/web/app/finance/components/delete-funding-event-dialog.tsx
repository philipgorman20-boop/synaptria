'use client';

import { useActionState } from 'react';
import { useFormStatus } from 'react-dom';
import type { FundingEvent } from '@synaptria/domain/budgets';

import { deleteFundingEventAction } from '../../actions/budgets/delete-funding-event';
import { initialDeleteFundingEventState } from '../../actions/budgets/delete-funding-event-form';

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <button className="danger-button" type="submit" disabled={pending}>
      {pending ? 'Deleting...' : 'Delete'}
    </button>
  );
}

interface DeleteFundingEventDialogProps {
  readonly event: FundingEvent;
}

export function DeleteFundingEventDialog({ event }: DeleteFundingEventDialogProps) {
  const dialogId = `delete-funding-event-dialog-${event.id}`;
  const boundAction = deleteFundingEventAction.bind(null, event.id);
  const [state, formAction] = useActionState(boundAction, initialDeleteFundingEventState);

  return (
    <>
      <button
        className="table-action-button table-action-button--danger"
        type="button"
        onClick={() => (document.getElementById(dialogId) as HTMLDialogElement)?.showModal()}
      >
        Delete
      </button>

      <dialog id={dialogId} className="organization-dialog">
        <form action={formAction} className="organization-form">
          <div className="organization-dialog-heading">
            <div>
              <p className="eyebrow">DELETE FUNDING EVENT</p>
              <h2>Delete {event.name}?</h2>
              <p>This will permanently remove this funding event from your records.</p>
            </div>
            <button
              aria-label="Close dialog"
              className="dialog-close-button"
              type="button"
              onClick={() => (document.getElementById(dialogId) as HTMLDialogElement)?.close()}
            >
              ×
            </button>
          </div>

          {state.status === 'error' && state.message !== undefined ? (
            <div className="form-error-summary" role="alert">{state.message}</div>
          ) : null}

          <div className="form-actions">
            <button
              className="secondary-button"
              type="button"
              onClick={() => (document.getElementById(dialogId) as HTMLDialogElement)?.close()}
            >
              Cancel
            </button>
            <SubmitButton />
          </div>
        </form>
      </dialog>
    </>
  );
}
