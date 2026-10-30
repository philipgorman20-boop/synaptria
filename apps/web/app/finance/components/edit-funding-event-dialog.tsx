'use client';

import { useActionState } from 'react';
import { useFormStatus } from 'react-dom';
import type { FundingEvent } from '@synaptria/domain/budgets';

import { updateFundingEventAction } from '../../actions/budgets/update-funding-event';
import { initialUpdateFundingEventState } from '../../actions/budgets/update-funding-event-form';

const FUNDING_EVENT_TYPES = [
  { value: 'SEED', label: 'Seed' },
  { value: 'SERIES_A', label: 'Series A' },
  { value: 'SERIES_B', label: 'Series B' },
  { value: 'SERIES_C', label: 'Series C' },
  { value: 'SERIES_D', label: 'Series D' },
  { value: 'GRANT', label: 'Grant' },
  { value: 'REVENUE', label: 'Revenue' },
  { value: 'LOAN', label: 'Loan' },
  { value: 'CONVERTIBLE_NOTE', label: 'Convertible Note' },
  { value: 'SAFE', label: 'SAFE' },
  { value: 'OTHER', label: 'Other' },
] as const;

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <button className="primary-button" type="submit" disabled={pending}>
      {pending ? 'Saving...' : 'Save changes'}
    </button>
  );
}

interface EditFundingEventDialogProps {
  readonly event: FundingEvent;
}

export function EditFundingEventDialog({ event }: EditFundingEventDialogProps) {
  const dialogId = `edit-funding-event-dialog-${event.id}`;
  const boundAction = updateFundingEventAction.bind(null, event.id);
  const [state, formAction] = useActionState(boundAction, initialUpdateFundingEventState);

  const toDateInput = (d?: Date) => d ? d.toISOString().slice(0, 10) : '';

  return (
    <>
      <button
        className="table-action-button"
        type="button"
        onClick={() => (document.getElementById(dialogId) as HTMLDialogElement)?.showModal()}
      >
        Edit
      </button>

      <dialog id={dialogId} className="organization-dialog">
        <form action={formAction} className="organization-form">
          <div className="organization-dialog-heading">
            <div>
              <p className="eyebrow">EDIT FUNDING EVENT</p>
              <h2>Edit {event.name}</h2>
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

          <div className="form-field">
            <label htmlFor={`${dialogId}-name`}>Name</label>
            <input
              id={`${dialogId}-name`}
              name="name"
              type="text"
              required
              maxLength={200}
              defaultValue={state.values?.name ?? event.name}
              aria-invalid={state.fieldErrors?.name !== undefined}
            />
            {state.fieldErrors?.name !== undefined ? (
              <p className="field-error">{state.fieldErrors.name}</p>
            ) : null}
          </div>

          <div className="form-field">
            <label htmlFor={`${dialogId}-type`}>Type</label>
            <select id={`${dialogId}-type`} name="type" defaultValue={state.values?.type ?? event.type}>
              {FUNDING_EVENT_TYPES.map(({ value, label }) => (
                <option key={value} value={value}>{label}</option>
              ))}
            </select>
          </div>

          <div className="form-field">
            <label htmlFor={`${dialogId}-status`}>Status</label>
            <select id={`${dialogId}-status`} name="status" defaultValue={state.values?.status ?? event.status}>
              <option value="COMMITTED">Committed</option>
              <option value="RECEIVED">Received</option>
            </select>
          </div>

          <div className="form-row">
            <div className="form-field">
              <label htmlFor={`${dialogId}-amount`}>Amount</label>
              <input
                id={`${dialogId}-amount`}
                name="amount"
                type="number"
                step="0.01"
                min="0.01"
                required
                defaultValue={state.values?.amount ?? String(event.amount)}
                aria-invalid={state.fieldErrors?.amount !== undefined}
              />
              {state.fieldErrors?.amount !== undefined ? (
                <p className="field-error">{state.fieldErrors.amount}</p>
              ) : null}
            </div>

            <div className="form-field">
              <label htmlFor={`${dialogId}-currency`}>Currency</label>
              <input
                id={`${dialogId}-currency`}
                name="currency"
                type="text"
                maxLength={3}
                defaultValue={state.values?.currency ?? event.currency}
              />
            </div>
          </div>

          <div className="form-row">
            <div className="form-field">
              <label htmlFor={`${dialogId}-expected-at`}>Expected date</label>
              <input
                id={`${dialogId}-expected-at`}
                name="expectedAt"
                type="date"
                defaultValue={state.values?.expectedAt ?? toDateInput(event.expectedAt)}
              />
            </div>

            <div className="form-field">
              <label htmlFor={`${dialogId}-received-at`}>Received date</label>
              <input
                id={`${dialogId}-received-at`}
                name="receivedAt"
                type="date"
                defaultValue={state.values?.receivedAt ?? toDateInput(event.receivedAt)}
              />
            </div>
          </div>

          <div className="form-field">
            <label htmlFor={`${dialogId}-investor`}>Investor / Source</label>
            <input
              id={`${dialogId}-investor`}
              name="investor"
              type="text"
              maxLength={200}
              defaultValue={state.values?.investor ?? (event.investor ?? '')}
            />
          </div>

          <div className="form-field">
            <label htmlFor={`${dialogId}-notes`}>Notes</label>
            <textarea
              id={`${dialogId}-notes`}
              name="notes"
              rows={3}
              maxLength={2000}
              defaultValue={state.values?.notes ?? (event.notes ?? '')}
            />
          </div>

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
