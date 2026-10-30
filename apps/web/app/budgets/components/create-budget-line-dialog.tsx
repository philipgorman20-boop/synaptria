'use client';

import type { BudgetCategory } from '@synaptria/domain/budgets';
import type { Program } from '@synaptria/domain/programs';
import type { Project } from '@synaptria/domain/projects';
import type { BudgetId } from '@synaptria/core';
import { useActionState, useCallback } from 'react';
import { useFormStatus } from 'react-dom';

import { createBudgetLineAction } from '../../actions/budgets/create-budget-line';
import { initialCreateBudgetLineState } from '../../actions/budgets/create-budget-line-form';

const DIALOG_ID = 'create-budget-line-dialog';

export interface CreateBudgetLineDialogProps {
  readonly budgetId: BudgetId;
  readonly categories: readonly BudgetCategory[];
  readonly programs: readonly Program[];
  readonly projects: readonly Project[];
}

export function CreateBudgetLineDialog({ budgetId, categories, programs, projects }: CreateBudgetLineDialogProps) {
  const boundAction = useCallback(
    createBudgetLineAction.bind(null, budgetId),
    [budgetId],
  );
  const [state, formAction] = useActionState(boundAction, initialCreateBudgetLineState);

  const close = () => (document.getElementById(DIALOG_ID) as HTMLDialogElement)?.close();
  const open = () => (document.getElementById(DIALOG_ID) as HTMLDialogElement)?.showModal();

  return (
    <>
      <button className="primary-button" type="button" onClick={open}>Add line item</button>

      <dialog id={DIALOG_ID} className="organization-dialog">
        <form action={formAction} className="organization-form">
          <div className="organization-dialog-heading">
            <div>
              <p className="eyebrow">FINANCE</p>
              <h2>Add budget line</h2>
            </div>
            <button aria-label="Close dialog" className="dialog-close-button" type="button" onClick={close}>×</button>
          </div>

          {state.status === 'error' && state.message !== undefined ? (
            <div className="form-error-summary" role="alert">{state.message}</div>
          ) : null}

          <div className="form-field">
            <label htmlFor="create-line-name">Name</label>
            <input
              id="create-line-name"
              name="name"
              type="text"
              required
              maxLength={200}
              defaultValue={state.values?.name ?? ''}
              aria-invalid={state.fieldErrors?.name !== undefined}
            />
            {state.fieldErrors?.name !== undefined ? (
              <span className="form-field-error">{state.fieldErrors.name}</span>
            ) : null}
          </div>

          <div className="form-field">
            <label htmlFor="create-line-category">Category</label>
            <select
              id="create-line-category"
              name="categoryId"
              required
              defaultValue={state.values?.categoryId ?? ''}
              aria-invalid={state.fieldErrors?.categoryId !== undefined}
            >
              <option value="">Select a category</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
            {state.fieldErrors?.categoryId !== undefined ? (
              <span className="form-field-error">{state.fieldErrors.categoryId}</span>
            ) : null}
          </div>

          {programs.length > 0 ? (
            <div className="form-field">
              <label htmlFor="create-line-program">Program</label>
              <select id="create-line-program" name="programId" defaultValue={state.values?.programId ?? ''}>
                <option value="">None</option>
                {programs.map((p) => (
                  <option key={p.id} value={p.id}>{p.name}</option>
                ))}
              </select>
            </div>
          ) : null}

          {projects.length > 0 ? (
            <div className="form-field">
              <label htmlFor="create-line-project">Project</label>
              <select id="create-line-project" name="projectId" defaultValue={state.values?.projectId ?? ''}>
                <option value="">None</option>
                {projects.map((p) => (
                  <option key={p.id} value={p.id}>{p.name}</option>
                ))}
              </select>
            </div>
          ) : null}

          <div className="form-field">
            <label htmlFor="create-line-amount">Planned amount</label>
            <input
              id="create-line-amount"
              name="plannedAmount"
              type="number"
              min="0"
              step="0.01"
              defaultValue={state.values?.plannedAmount ?? ''}
            />
          </div>

          <div className="form-field">
            <label htmlFor="create-line-actual">Actual amount</label>
            <input
              id="create-line-actual"
              name="actualAmount"
              type="number"
              min="0"
              step="0.01"
              defaultValue={state.values?.actualAmount ?? ''}
            />
          </div>

          <div className="form-field">
            <label htmlFor="create-line-currency">Currency</label>
            <input
              id="create-line-currency"
              name="currency"
              type="text"
              maxLength={10}
              placeholder="USD"
              defaultValue={state.values?.currency ?? ''}
            />
          </div>

          <div className="form-field">
            <label htmlFor="create-line-period-start">Period start</label>
            <input
              id="create-line-period-start"
              name="periodStart"
              type="date"
              required
              defaultValue={state.values?.periodStart ?? ''}
              aria-invalid={state.fieldErrors?.periodStart !== undefined}
            />
            {state.fieldErrors?.periodStart !== undefined ? (
              <span className="form-field-error">{state.fieldErrors.periodStart}</span>
            ) : null}
          </div>

          <div className="form-field">
            <label htmlFor="create-line-period-end">Period end</label>
            <input
              id="create-line-period-end"
              name="periodEnd"
              type="date"
              required
              defaultValue={state.values?.periodEnd ?? ''}
              aria-invalid={state.fieldErrors?.periodEnd !== undefined}
            />
            {state.fieldErrors?.periodEnd !== undefined ? (
              <span className="form-field-error">{state.fieldErrors.periodEnd}</span>
            ) : null}
          </div>

          <div className="form-field">
            <label htmlFor="create-line-notes">Notes</label>
            <textarea
              id="create-line-notes"
              name="notes"
              rows={3}
              maxLength={2000}
              defaultValue={state.values?.notes ?? ''}
            />
          </div>

          <div className="organization-form-actions">
            <button className="secondary-button" type="button" onClick={close}>Cancel</button>
            <CreateBudgetLineSubmitButton />
          </div>
        </form>
      </dialog>
    </>
  );
}

function CreateBudgetLineSubmitButton() {
  const { pending } = useFormStatus();
  return (
    <button className="primary-button" type="submit" disabled={pending}>
      {pending ? 'Adding…' : 'Add line item'}
    </button>
  );
}
