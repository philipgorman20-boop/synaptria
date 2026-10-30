'use client';

import type { Budget } from '@synaptria/domain/budgets';
import { useActionState, useCallback } from 'react';
import { useFormStatus } from 'react-dom';

import { updateBudgetAction } from '../../actions/budgets/update-budget';
import { initialUpdateBudgetState } from '../../actions/budgets/update-budget-form';

const BUDGET_PERIOD_TYPES = [
  { value: 'MONTHLY', label: 'Monthly' },
  { value: 'QUARTERLY', label: 'Quarterly' },
  { value: 'ANNUAL', label: 'Annual' },
  { value: 'CUSTOM', label: 'Custom' },
] as const;

const BUDGET_STATUSES = [
  { value: 'DRAFT', label: 'Draft' },
  { value: 'APPROVED', label: 'Approved' },
  { value: 'ACTIVE', label: 'Active' },
  { value: 'CLOSED', label: 'Closed' },
  { value: 'ARCHIVED', label: 'Archived' },
] as const;

const DIALOG_ID = 'edit-budget-dialog';

function toDateInput(date: Date): string {
  return date.toISOString().slice(0, 10);
}

export interface EditBudgetDialogProps {
  readonly budget: Budget;
}

export function EditBudgetDialog({ budget }: EditBudgetDialogProps) {
  const boundAction = useCallback(
    updateBudgetAction.bind(null, budget.id),
    [budget.id],
  );
  const [state, formAction] = useActionState(boundAction, initialUpdateBudgetState);

  const close = () => (document.getElementById(DIALOG_ID) as HTMLDialogElement)?.close();
  const open = () => (document.getElementById(DIALOG_ID) as HTMLDialogElement)?.showModal();

  return (
    <>
      <button className="secondary-button" type="button" onClick={open}>Edit budget</button>

      <dialog id={DIALOG_ID} className="organization-dialog">
        <form action={formAction} className="organization-form">
          <div className="organization-dialog-heading">
            <div>
              <p className="eyebrow">EDIT BUDGET</p>
              <h2>Update budget</h2>
            </div>
            <button aria-label="Close dialog" className="dialog-close-button" type="button" onClick={close}>×</button>
          </div>

          {state.status === 'error' && state.message !== undefined ? (
            <div className="form-error-summary" role="alert">{state.message}</div>
          ) : null}
          {state.status === 'success' ? (
            <div className="form-success-summary" role="status">Budget updated successfully.</div>
          ) : null}

          <div className="form-field">
            <label htmlFor="edit-budget-name">Budget name</label>
            <input
              id="edit-budget-name"
              name="name"
              type="text"
              required
              maxLength={200}
              defaultValue={state.values?.name ?? budget.name}
              aria-invalid={state.fieldErrors?.name !== undefined}
            />
            {state.fieldErrors?.name !== undefined ? (
              <span className="form-field-error">{state.fieldErrors.name}</span>
            ) : null}
          </div>

          <div className="form-field">
            <label htmlFor="edit-budget-status">Status</label>
            <select id="edit-budget-status" name="status" defaultValue={state.values?.status ?? budget.status}>
              {BUDGET_STATUSES.map((s) => (
                <option key={s.value} value={s.value}>{s.label}</option>
              ))}
            </select>
          </div>

          <div className="form-field">
            <label htmlFor="edit-budget-period">Period type</label>
            <select id="edit-budget-period" name="periodType" defaultValue={state.values?.periodType ?? budget.periodType}>
              {BUDGET_PERIOD_TYPES.map((p) => (
                <option key={p.value} value={p.value}>{p.label}</option>
              ))}
            </select>
          </div>

          <div className="form-field">
            <label htmlFor="edit-budget-currency">Currency</label>
            <input
              id="edit-budget-currency"
              name="currency"
              type="text"
              maxLength={10}
              defaultValue={state.values?.currency ?? budget.currency}
            />
          </div>

          <div className="form-field">
            <label htmlFor="edit-budget-start">Start date</label>
            <input
              id="edit-budget-start"
              name="startDate"
              type="date"
              required
              defaultValue={state.values?.startDate ?? toDateInput(budget.startDate)}
              aria-invalid={state.fieldErrors?.startDate !== undefined}
            />
            {state.fieldErrors?.startDate !== undefined ? (
              <span className="form-field-error">{state.fieldErrors.startDate}</span>
            ) : null}
          </div>

          <div className="form-field">
            <label htmlFor="edit-budget-end">End date</label>
            <input
              id="edit-budget-end"
              name="endDate"
              type="date"
              required
              defaultValue={state.values?.endDate ?? toDateInput(budget.endDate)}
              aria-invalid={state.fieldErrors?.endDate !== undefined}
            />
            {state.fieldErrors?.endDate !== undefined ? (
              <span className="form-field-error">{state.fieldErrors.endDate}</span>
            ) : null}
          </div>

          <div className="form-field">
            <label htmlFor="edit-budget-description">Description</label>
            <textarea
              id="edit-budget-description"
              name="description"
              rows={3}
              maxLength={2000}
              defaultValue={state.values?.description ?? (budget.description ?? '')}
            />
          </div>

          <div className="organization-form-actions">
            <button className="secondary-button" type="button" onClick={close}>Cancel</button>
            <EditBudgetSubmitButton />
          </div>
        </form>
      </dialog>
    </>
  );
}

function EditBudgetSubmitButton() {
  const { pending } = useFormStatus();
  return (
    <button className="primary-button" type="submit" disabled={pending}>
      {pending ? 'Saving…' : 'Save changes'}
    </button>
  );
}
