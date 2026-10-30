'use client';

import type { Budget } from '@synaptria/domain/budgets';
import { useActionState, useCallback } from 'react';
import { useFormStatus } from 'react-dom';

import { deleteBudgetAction } from '../../actions/budgets/delete-budget';
import { initialDeleteBudgetState } from '../../actions/budgets/delete-budget-form';

const DIALOG_ID = 'delete-budget-dialog';

export interface DeleteBudgetDialogProps {
  readonly budget: Budget;
}

export function DeleteBudgetDialog({ budget }: DeleteBudgetDialogProps) {
  const boundAction = useCallback(
    deleteBudgetAction.bind(null, budget.id),
    [budget.id],
  );
  const [state, formAction] = useActionState(boundAction, initialDeleteBudgetState);

  const close = () => (document.getElementById(DIALOG_ID) as HTMLDialogElement)?.close();
  const open = () => (document.getElementById(DIALOG_ID) as HTMLDialogElement)?.showModal();

  return (
    <>
      <button className="danger-button" type="button" onClick={open}>Delete</button>

      <dialog id={DIALOG_ID} className="organization-dialog">
        <form action={formAction} className="organization-form">
          <div className="organization-dialog-heading">
            <div>
              <p className="eyebrow">DELETE BUDGET</p>
              <h2>Delete budget?</h2>
            </div>
            <button aria-label="Close dialog" className="dialog-close-button" type="button" onClick={close}>×</button>
          </div>

          <p className="delete-confirm-message">
            Are you sure you want to delete <strong>{budget.name}</strong>? This action cannot be undone.
          </p>

          {state.status === 'error' && state.message !== undefined ? (
            <div className="form-error-summary" role="alert">{state.message}</div>
          ) : null}

          <div className="organization-form-actions">
            <button className="secondary-button" type="button" onClick={close}>Cancel</button>
            <DeleteBudgetSubmitButton />
          </div>
        </form>
      </dialog>
    </>
  );
}

function DeleteBudgetSubmitButton() {
  const { pending } = useFormStatus();
  return (
    <button className="danger-button" type="submit" disabled={pending}>
      {pending ? 'Deleting…' : 'Delete budget'}
    </button>
  );
}
