'use client';

import type { BudgetCategory, BudgetLine } from '@synaptria/domain/budgets';
import type { Program } from '@synaptria/domain/programs';
import type { Project } from '@synaptria/domain/projects';
import type { BudgetId } from '@synaptria/core';
import { useActionState, useCallback } from 'react';
import { useFormStatus } from 'react-dom';

import { updateBudgetLineAction } from '../../actions/budgets/update-budget-line';
import { initialUpdateBudgetLineState } from '../../actions/budgets/update-budget-line-form';

function toDateInput(date: Date): string {
  return date.toISOString().slice(0, 10);
}

export interface EditBudgetLineDialogProps {
  readonly budgetId: BudgetId;
  readonly line: BudgetLine;
  readonly categories: readonly BudgetCategory[];
  readonly programs: readonly Program[];
  readonly projects: readonly Project[];
}

export function EditBudgetLineDialog({ budgetId, line, categories, programs, projects }: EditBudgetLineDialogProps) {
  const dialogId = `edit-budget-line-dialog-${line.id}`;
  const boundAction = useCallback(
    updateBudgetLineAction.bind(null, budgetId, line.id),
    [budgetId, line.id],
  );
  const [state, formAction] = useActionState(boundAction, initialUpdateBudgetLineState);

  const close = () => (document.getElementById(dialogId) as HTMLDialogElement)?.close();
  const open = () => (document.getElementById(dialogId) as HTMLDialogElement)?.showModal();

  return (
    <>
      <button className="secondary-button" type="button" onClick={open}>Edit</button>

      <dialog id={dialogId} className="organization-dialog">
        <form action={formAction} className="organization-form">
          <div className="organization-dialog-heading">
            <div>
              <p className="eyebrow">EDIT LINE ITEM</p>
              <h2>Update budget line</h2>
            </div>
            <button aria-label="Close dialog" className="dialog-close-button" type="button" onClick={close}>×</button>
          </div>

          {state.status === 'error' && state.message !== undefined ? (
            <div className="form-error-summary" role="alert">{state.message}</div>
          ) : null}
          {state.status === 'success' ? (
            <div className="form-success-summary" role="status">Budget line updated successfully.</div>
          ) : null}

          <div className="form-field">
            <label htmlFor={`edit-line-name-${line.id}`}>Name</label>
            <input
              id={`edit-line-name-${line.id}`}
              name="name"
              type="text"
              required
              maxLength={200}
              defaultValue={state.values?.name ?? line.name}
              aria-invalid={state.fieldErrors?.name !== undefined}
            />
            {state.fieldErrors?.name !== undefined ? (
              <span className="form-field-error">{state.fieldErrors.name}</span>
            ) : null}
          </div>

          <div className="form-field">
            <label htmlFor={`edit-line-category-${line.id}`}>Category</label>
            <select
              id={`edit-line-category-${line.id}`}
              name="categoryId"
              required
              defaultValue={state.values?.categoryId ?? line.categoryId}
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
              <label htmlFor={`edit-line-program-${line.id}`}>Program</label>
              <select
                id={`edit-line-program-${line.id}`}
                name="programId"
                defaultValue={state.values?.programId ?? (line.programId ?? '')}
              >
                <option value="">None</option>
                {programs.map((p) => (
                  <option key={p.id} value={p.id}>{p.name}</option>
                ))}
              </select>
            </div>
          ) : null}

          {projects.length > 0 ? (
            <div className="form-field">
              <label htmlFor={`edit-line-project-${line.id}`}>Project</label>
              <select
                id={`edit-line-project-${line.id}`}
                name="projectId"
                defaultValue={state.values?.projectId ?? (line.projectId ?? '')}
              >
                <option value="">None</option>
                {projects.map((p) => (
                  <option key={p.id} value={p.id}>{p.name}</option>
                ))}
              </select>
            </div>
          ) : null}

          <div className="form-field">
            <label htmlFor={`edit-line-amount-${line.id}`}>Planned amount</label>
            <input
              id={`edit-line-amount-${line.id}`}
              name="plannedAmount"
              type="number"
              min="0"
              step="0.01"
              defaultValue={state.values?.plannedAmount ?? (line.plannedAmount > 0 ? String(line.plannedAmount) : '')}
            />
          </div>

          <div className="form-field">
            <label htmlFor={`edit-line-actual-${line.id}`}>Actual amount</label>
            <input
              id={`edit-line-actual-${line.id}`}
              name="actualAmount"
              type="number"
              min="0"
              step="0.01"
              defaultValue={state.values?.actualAmount ?? (line.actualAmount > 0 ? String(line.actualAmount) : '')}
            />
          </div>

          <div className="form-field">
            <label htmlFor={`edit-line-currency-${line.id}`}>Currency</label>
            <input
              id={`edit-line-currency-${line.id}`}
              name="currency"
              type="text"
              maxLength={10}
              defaultValue={state.values?.currency ?? line.currency}
            />
          </div>

          <div className="form-field">
            <label htmlFor={`edit-line-period-start-${line.id}`}>Period start</label>
            <input
              id={`edit-line-period-start-${line.id}`}
              name="periodStart"
              type="date"
              required
              defaultValue={state.values?.periodStart ?? toDateInput(line.periodStart)}
              aria-invalid={state.fieldErrors?.periodStart !== undefined}
            />
            {state.fieldErrors?.periodStart !== undefined ? (
              <span className="form-field-error">{state.fieldErrors.periodStart}</span>
            ) : null}
          </div>

          <div className="form-field">
            <label htmlFor={`edit-line-period-end-${line.id}`}>Period end</label>
            <input
              id={`edit-line-period-end-${line.id}`}
              name="periodEnd"
              type="date"
              required
              defaultValue={state.values?.periodEnd ?? toDateInput(line.periodEnd)}
              aria-invalid={state.fieldErrors?.periodEnd !== undefined}
            />
            {state.fieldErrors?.periodEnd !== undefined ? (
              <span className="form-field-error">{state.fieldErrors.periodEnd}</span>
            ) : null}
          </div>

          <div className="form-field">
            <label htmlFor={`edit-line-notes-${line.id}`}>Notes</label>
            <textarea
              id={`edit-line-notes-${line.id}`}
              name="notes"
              rows={3}
              maxLength={2000}
              defaultValue={state.values?.notes ?? (line.notes ?? '')}
            />
          </div>

          <div className="organization-form-actions">
            <button className="secondary-button" type="button" onClick={close}>Cancel</button>
            <EditBudgetLineSubmitButton />
          </div>
        </form>
      </dialog>
    </>
  );
}

function EditBudgetLineSubmitButton() {
  const { pending } = useFormStatus();
  return (
    <button className="primary-button" type="submit" disabled={pending}>
      {pending ? 'Saving…' : 'Save changes'}
    </button>
  );
}
