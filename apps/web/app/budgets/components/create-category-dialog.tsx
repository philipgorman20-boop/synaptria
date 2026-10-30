'use client';

import { useActionState } from 'react';
import { useFormStatus } from 'react-dom';

import { createBudgetCategoryAction } from '../../actions/budgets/create-budget-category';
import { initialCreateBudgetCategoryState } from '../../actions/budgets/create-budget-category-form';

const DIALOG_ID = 'create-budget-category-dialog';

const OUTFLOW_TYPES = [
  { value: 'OPERATIONAL', label: 'Operational — core operating expenses' },
  { value: 'DISCRETIONARY', label: 'Discretionary — variable or non-essential spend' },
] as const;

export function CreateCategoryDialog() {
  const [state, formAction] = useActionState(createBudgetCategoryAction, initialCreateBudgetCategoryState);

  const close = () => (document.getElementById(DIALOG_ID) as HTMLDialogElement)?.close();
  const open = () => (document.getElementById(DIALOG_ID) as HTMLDialogElement)?.showModal();

  return (
    <>
      <button className="secondary-button" type="button" onClick={open}>New category</button>

      <dialog id={DIALOG_ID} className="organization-dialog">
        <form action={formAction} className="organization-form">
          <div className="organization-dialog-heading">
            <div>
              <p className="eyebrow">BUDGET CATEGORIES</p>
              <h2>Create a category</h2>
              <p>Categories organise budget lines by spend type.</p>
            </div>
            <button aria-label="Close dialog" className="dialog-close-button" type="button" onClick={close}>×</button>
          </div>

          {state.status === 'error' && state.message !== undefined ? (
            <div className="form-error-summary" role="alert">{state.message}</div>
          ) : null}

          <div className="form-field">
            <label htmlFor="create-cat-name">Name</label>
            <input
              id="create-cat-name"
              name="name"
              type="text"
              required
              maxLength={200}
              autoFocus
              defaultValue={state.values?.name ?? ''}
              aria-invalid={state.fieldErrors?.name !== undefined}
              placeholder="e.g. Lab Supplies"
            />
            {state.fieldErrors?.name !== undefined ? (
              <span className="form-field-error">{state.fieldErrors.name}</span>
            ) : null}
          </div>

          <div className="form-field">
            <label htmlFor="create-cat-outflow-type">Outflow type</label>
            <select
              id="create-cat-outflow-type"
              name="outflowType"
              defaultValue={state.values?.outflowType ?? 'OPERATIONAL'}
            >
              {OUTFLOW_TYPES.map((t) => (
                <option key={t.value} value={t.value}>{t.label}</option>
              ))}
            </select>
          </div>

          <div className="form-field">
            <label htmlFor="create-cat-code">Code <span style={{ fontWeight: 400, color: '#6b7280' }}>(optional)</span></label>
            <input
              id="create-cat-code"
              name="code"
              type="text"
              maxLength={50}
              defaultValue={state.values?.code ?? ''}
              placeholder="e.g. LAB-001"
            />
          </div>

          <div className="form-field">
            <label htmlFor="create-cat-description">Description <span style={{ fontWeight: 400, color: '#6b7280' }}>(optional)</span></label>
            <textarea
              id="create-cat-description"
              name="description"
              rows={2}
              maxLength={500}
              defaultValue={state.values?.description ?? ''}
            />
          </div>

          <div className="organization-form-actions">
            <button className="secondary-button" type="button" onClick={close}>Cancel</button>
            <CreateCategorySubmitButton />
          </div>
        </form>
      </dialog>
    </>
  );
}

function CreateCategorySubmitButton() {
  const { pending } = useFormStatus();
  return (
    <button className="primary-button" type="submit" disabled={pending}>
      {pending ? 'Creating…' : 'Create category'}
    </button>
  );
}
