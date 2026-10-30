'use client';

import type { BudgetCategory } from '@synaptria/domain/budgets';
import { useActionState, useCallback } from 'react';
import { useFormStatus } from 'react-dom';

import { deleteBudgetCategoryAction } from '../../actions/budgets/delete-budget-category';
import { initialDeleteBudgetCategoryState } from '../../actions/budgets/delete-budget-category-form';

export function DeleteCategoryDialog({ category }: { readonly category: BudgetCategory }) {
  const dialogId = `delete-category-dialog-${category.id}`;
  const boundAction = useCallback(
    deleteBudgetCategoryAction.bind(null, category.id),
    [category.id],
  );
  const [state, formAction] = useActionState(boundAction, initialDeleteBudgetCategoryState);

  const close = () => (document.getElementById(dialogId) as HTMLDialogElement)?.close();
  const open = () => (document.getElementById(dialogId) as HTMLDialogElement)?.showModal();

  return (
    <>
      <button className="table-action-button table-action-button--danger" type="button" onClick={open}>Delete</button>

      <dialog id={dialogId} className="organization-dialog">
        <form action={formAction} className="organization-form">
          <div className="organization-dialog-heading">
            <div>
              <p className="eyebrow">DELETE CATEGORY</p>
              <h2>Delete &ldquo;{category.name}&rdquo;?</h2>
              <p>This will remove the category. Budget lines assigned to it must be reassigned first.</p>
            </div>
            <button aria-label="Close dialog" className="dialog-close-button" type="button" onClick={close}>×</button>
          </div>

          {state.status === 'error' && state.message !== undefined ? (
            <div className="form-error-summary" role="alert">{state.message}</div>
          ) : null}

          <div className="organization-form-actions">
            <button className="secondary-button" type="button" onClick={close}>Cancel</button>
            <DeleteCategorySubmitButton />
          </div>
        </form>
      </dialog>
    </>
  );
}

function DeleteCategorySubmitButton() {
  const { pending } = useFormStatus();
  return (
    <button className="danger-button" type="submit" disabled={pending}>
      {pending ? 'Deleting…' : 'Delete category'}
    </button>
  );
}
