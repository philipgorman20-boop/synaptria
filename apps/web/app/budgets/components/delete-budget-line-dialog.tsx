'use client';

import type { BudgetLine } from '@synaptria/domain/budgets';
import type { BudgetId } from '@synaptria/core';
import { useActionState, useCallback } from 'react';
import { useFormStatus } from 'react-dom';

import { deleteBudgetLineAction } from '../../actions/budgets/delete-budget-line';
import { initialDeleteBudgetLineState } from '../../actions/budgets/delete-budget-line-form';

export interface DeleteBudgetLineDialogProps {
  readonly budgetId: BudgetId;
  readonly line: BudgetLine;
}

export function DeleteBudgetLineDialog({ budgetId, line }: DeleteBudgetLineDialogProps) {
  const dialogId = `delete-budget-line-dialog-${line.id}`;
  const boundAction = useCallback(
    deleteBudgetLineAction.bind(null, budgetId, line.id),
    [budgetId, line.id],
  );
  const [state, formAction] = useActionState(boundAction, initialDeleteBudgetLineState);

  const close = () => (document.getElementById(dialogId) as HTMLDialogElement)?.close();
  const open = () => (document.getElementById(dialogId) as HTMLDialogElement)?.showModal();

  return (
    <>
      <button className="danger-button" type="button" onClick={open}>Delete</button>

      <dialog id={dialogId} className="organization-dialog">
        <form action={formAction} className="organization-form">
          <div className="organization-dialog-heading">
            <div>
              <p className="eyebrow">DELETE LINE ITEM</p>
              <h2>Delete budget line?</h2>
            </div>
            <button aria-label="Close dialog" className="dialog-close-button" type="button" onClick={close}>×</button>
          </div>

          <p className="delete-confirm-message">
            Are you sure you want to delete <strong>{line.name}</strong>? This action cannot be undone.
          </p>

          {state.status === 'error' && state.message !== undefined ? (
            <div className="form-error-summary" role="alert">{state.message}</div>
          ) : null}

          <div className="organization-form-actions">
            <button className="secondary-button" type="button" onClick={close}>Cancel</button>
            <DeleteBudgetLineSubmitButton />
          </div>
        </form>
      </dialog>
    </>
  );
}

function DeleteBudgetLineSubmitButton() {
  const { pending } = useFormStatus();
  return (
    <button className="danger-button" type="submit" disabled={pending}>
      {pending ? 'Deleting…' : 'Delete line item'}
    </button>
  );
}
