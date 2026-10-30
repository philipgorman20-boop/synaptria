'use client';

import type { BudgetCategory } from '@synaptria/domain/budgets';
import { useActionState, useCallback } from 'react';
import { useFormStatus } from 'react-dom';

import { updateBudgetCategoryAction } from '../../actions/budgets/update-budget-category';
import { initialUpdateBudgetCategoryState } from '../../actions/budgets/update-budget-category-form';

const OUTFLOW_TYPES = [
  { value: 'OPERATIONAL', label: 'Operational' },
  { value: 'DISCRETIONARY', label: 'Discretionary' },
] as const;

export function EditCategoryDialog({ category }: { readonly category: BudgetCategory }) {
  const dialogId = `edit-category-dialog-${category.id}`;
  const boundAction = useCallback(
    updateBudgetCategoryAction.bind(null, category.id),
    [category.id],
  );
  const [state, formAction] = useActionState(boundAction, initialUpdateBudgetCategoryState);

  const close = () => (document.getElementById(dialogId) as HTMLDialogElement)?.close();
  const open = () => (document.getElementById(dialogId) as HTMLDialogElement)?.showModal();

  return (
    <>
      <button className="table-action-button" type="button" onClick={open}>Edit</button>

      <dialog id={dialogId} className="organization-dialog">
        <form action={formAction} className="organization-form">
          <div className="organization-dialog-heading">
            <div>
              <p className="eyebrow">EDIT CATEGORY</p>
              <h2>Update category</h2>
            </div>
            <button aria-label="Close dialog" className="dialog-close-button" type="button" onClick={close}>×</button>
          </div>

          {state.status === 'error' && state.message !== undefined ? (
            <div className="form-error-summary" role="alert">{state.message}</div>
          ) : null}
          {state.status === 'success' ? (
            <div className="form-success-summary" role="status">Category updated.</div>
          ) : null}

          <div className="form-field">
            <label htmlFor={`edit-cat-name-${category.id}`}>Name</label>
            <input
              id={`edit-cat-name-${category.id}`}
              name="name"
              type="text"
              required
              maxLength={200}
              defaultValue={state.values?.name ?? category.name}
            />
          </div>

          <div className="form-field">
            <label htmlFor={`edit-cat-outflow-${category.id}`}>Outflow type</label>
            <select
              id={`edit-cat-outflow-${category.id}`}
              name="outflowType"
              defaultValue={state.values?.outflowType ?? category.outflowType}
            >
              {OUTFLOW_TYPES.map((t) => (
                <option key={t.value} value={t.value}>{t.label}</option>
              ))}
            </select>
          </div>

          <div className="form-field">
            <label htmlFor={`edit-cat-code-${category.id}`}>Code</label>
            <input
              id={`edit-cat-code-${category.id}`}
              name="code"
              type="text"
              maxLength={50}
              defaultValue={state.values?.code ?? (category.code ?? '')}
            />
          </div>

          <div className="form-field">
            <label htmlFor={`edit-cat-desc-${category.id}`}>Description</label>
            <textarea
              id={`edit-cat-desc-${category.id}`}
              name="description"
              rows={2}
              maxLength={500}
              defaultValue={state.values?.description ?? (category.description ?? '')}
            />
          </div>

          <div className="organization-form-actions">
            <button className="secondary-button" type="button" onClick={close}>Cancel</button>
            <EditCategorySubmitButton />
          </div>
        </form>
      </dialog>
    </>
  );
}

function EditCategorySubmitButton() {
  const { pending } = useFormStatus();
  return (
    <button className="primary-button" type="submit" disabled={pending}>
      {pending ? 'Saving…' : 'Save changes'}
    </button>
  );
}
