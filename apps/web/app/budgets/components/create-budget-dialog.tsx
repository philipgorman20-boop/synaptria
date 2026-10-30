'use client';

import { useActionState } from 'react';
import { useFormStatus } from 'react-dom';

import { createBudgetAction } from '../../actions/budgets/create-budget';
import { initialCreateBudgetState } from '../../actions/budgets/create-budget-form';

const PERIOD_TYPES = [
  { value: 'ANNUAL', label: 'Annual' },
  { value: 'QUARTERLY', label: 'Quarterly' },
  { value: 'MONTHLY', label: 'Monthly' },
  { value: 'CUSTOM', label: 'Custom' },
] as const;

export function CreateBudgetDialog() {
  const [state, formAction] = useActionState(createBudgetAction, initialCreateBudgetState);

  return (
    <>
      <button
        className="primary-button"
        type="button"
        onClick={() => (document.getElementById('create-budget-dialog') as HTMLDialogElement)?.showModal()}
      >
        New budget
      </button>

      <dialog id="create-budget-dialog" className="organization-dialog">
        <form action={formAction} className="organization-form">
          <div className="organization-dialog-heading">
            <div>
              <p className="eyebrow">NEW BUDGET</p>
              <h2>Create a budget</h2>
              <p>Set up a budget to track planned and actual spend for your organization.</p>
            </div>
            <button
              aria-label="Close dialog"
              className="dialog-close-button"
              type="button"
              onClick={() => (document.getElementById('create-budget-dialog') as HTMLDialogElement)?.close()}
            >
              ×
            </button>
          </div>

          {state.status === 'error' && state.message !== undefined ? (
            <div className="form-error-summary" role="alert">{state.message}</div>
          ) : null}

          <div className="form-field">
            <label htmlFor="budget-name">Budget name</label>
            <input
              id="budget-name"
              name="name"
              type="text"
              autoComplete="off"
              autoFocus
              required
              maxLength={200}
              defaultValue={state.values?.name ?? ''}
              aria-invalid={state.fieldErrors?.name !== undefined}
              placeholder="FY2025 Operating Budget"
            />
            {state.fieldErrors?.name !== undefined ? (
              <span className="form-field-error">{state.fieldErrors.name}</span>
            ) : null}
          </div>

          <div className="form-field">
            <label htmlFor="budget-period-type">Period type</label>
            <select
              id="budget-period-type"
              name="periodType"
              required
              defaultValue={state.values?.periodType ?? ''}
              aria-invalid={state.fieldErrors?.periodType !== undefined}
            >
              <option value="">Select a period type</option>
              {PERIOD_TYPES.map((p) => (
                <option key={p.value} value={p.value}>{p.label}</option>
              ))}
            </select>
            {state.fieldErrors?.periodType !== undefined ? (
              <span className="form-field-error">{state.fieldErrors.periodType}</span>
            ) : null}
          </div>

          <div className="form-field">
            <label htmlFor="budget-start-date">Start date</label>
            <input
              id="budget-start-date"
              name="startDate"
              type="date"
              required
              defaultValue={state.values?.startDate ?? ''}
              aria-invalid={state.fieldErrors?.startDate !== undefined}
            />
            {state.fieldErrors?.startDate !== undefined ? (
              <span className="form-field-error">{state.fieldErrors.startDate}</span>
            ) : null}
          </div>

          <div className="form-field">
            <label htmlFor="budget-end-date">End date</label>
            <input
              id="budget-end-date"
              name="endDate"
              type="date"
              required
              defaultValue={state.values?.endDate ?? ''}
              aria-invalid={state.fieldErrors?.endDate !== undefined}
            />
            {state.fieldErrors?.endDate !== undefined ? (
              <span className="form-field-error">{state.fieldErrors.endDate}</span>
            ) : null}
          </div>

          <div className="form-field">
            <label htmlFor="budget-description">Description</label>
            <textarea
              id="budget-description"
              name="description"
              rows={3}
              maxLength={1000}
              defaultValue={state.values?.description ?? ''}
              placeholder="Optional notes about this budget…"
            />
          </div>

          <div className="organization-form-actions">
            <button
              className="secondary-button"
              type="button"
              onClick={() => (document.getElementById('create-budget-dialog') as HTMLDialogElement)?.close()}
            >
              Cancel
            </button>
            <CreateBudgetSubmitButton />
          </div>
        </form>
      </dialog>
    </>
  );
}

function CreateBudgetSubmitButton() {
  const { pending } = useFormStatus();
  return (
    <button className="primary-button" type="submit" disabled={pending}>
      {pending ? 'Creating…' : 'Create budget'}
    </button>
  );
}
