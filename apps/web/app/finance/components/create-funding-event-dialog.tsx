'use client';

import { useActionState } from 'react';
import { useFormStatus } from 'react-dom';

import { createFundingEventAction } from '../../actions/budgets/create-funding-event';
import { initialCreateFundingEventState } from '../../actions/budgets/create-funding-event-form';

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

const DIALOG_ID = 'create-funding-event-dialog';

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <button className="primary-button" type="submit" disabled={pending}>
      {pending ? 'Creating...' : 'Create funding event'}
    </button>
  );
}

export function CreateFundingEventDialog() {
  const [state, formAction] = useActionState(createFundingEventAction, initialCreateFundingEventState);

  return (
    <>
      <button
        className="primary-button"
        type="button"
        onClick={() => (document.getElementById(DIALOG_ID) as HTMLDialogElement)?.showModal()}
      >
        Record funding
      </button>

      <dialog id={DIALOG_ID} className="organization-dialog">
        <form action={formAction} className="organization-form">
          <div className="organization-dialog-heading">
            <div>
              <p className="eyebrow">NEW FUNDING EVENT</p>
              <h2>Record a funding event</h2>
              <p>Track an investment, grant, or other capital inflow.</p>
            </div>
            <button
              aria-label="Close dialog"
              className="dialog-close-button"
              type="button"
              onClick={() => (document.getElementById(DIALOG_ID) as HTMLDialogElement)?.close()}
            >
              ×
            </button>
          </div>

          {state.status === 'error' && state.message !== undefined ? (
            <div className="form-error-summary" role="alert">{state.message}</div>
          ) : null}

          <div className="form-field">
            <label htmlFor="fe-name">Name</label>
            <input
              id="fe-name"
              name="name"
              type="text"
              autoComplete="off"
              autoFocus
              required
              maxLength={200}
              defaultValue={state.values?.name ?? ''}
              aria-invalid={state.fieldErrors?.name !== undefined}
            />
            {state.fieldErrors?.name !== undefined ? (
              <p className="field-error">{state.fieldErrors.name}</p>
            ) : null}
          </div>

          <div className="form-field">
            <label htmlFor="fe-type">Type</label>
            <select id="fe-type" name="type" required defaultValue={state.values?.type ?? ''}>
              <option value="">Select type…</option>
              {FUNDING_EVENT_TYPES.map(({ value, label }) => (
                <option key={value} value={value}>{label}</option>
              ))}
            </select>
            {state.fieldErrors?.type !== undefined ? (
              <p className="field-error">{state.fieldErrors.type}</p>
            ) : null}
          </div>

          <div className="form-field">
            <label htmlFor="fe-status">Status</label>
            <select id="fe-status" name="status" defaultValue={state.values?.status ?? 'COMMITTED'}>
              <option value="COMMITTED">Committed</option>
              <option value="RECEIVED">Received</option>
            </select>
          </div>

          <div className="form-row">
            <div className="form-field">
              <label htmlFor="fe-amount">Amount</label>
              <input
                id="fe-amount"
                name="amount"
                type="number"
                step="0.01"
                min="0.01"
                required
                defaultValue={state.values?.amount ?? ''}
                aria-invalid={state.fieldErrors?.amount !== undefined}
              />
              {state.fieldErrors?.amount !== undefined ? (
                <p className="field-error">{state.fieldErrors.amount}</p>
              ) : null}
            </div>

            <div className="form-field">
              <label htmlFor="fe-currency">Currency</label>
              <input
                id="fe-currency"
                name="currency"
                type="text"
                maxLength={3}
                placeholder="USD"
                defaultValue={state.values?.currency ?? 'USD'}
              />
            </div>
          </div>

          <div className="form-row">
            <div className="form-field">
              <label htmlFor="fe-expected-at">Expected date</label>
              <input
                id="fe-expected-at"
                name="expectedAt"
                type="date"
                defaultValue={state.values?.expectedAt ?? ''}
              />
            </div>

            <div className="form-field">
              <label htmlFor="fe-received-at">Received date</label>
              <input
                id="fe-received-at"
                name="receivedAt"
                type="date"
                defaultValue={state.values?.receivedAt ?? ''}
              />
            </div>
          </div>

          <div className="form-field">
            <label htmlFor="fe-investor">Investor / Source</label>
            <input
              id="fe-investor"
              name="investor"
              type="text"
              maxLength={200}
              defaultValue={state.values?.investor ?? ''}
            />
          </div>

          <div className="form-field">
            <label htmlFor="fe-notes">Notes</label>
            <textarea
              id="fe-notes"
              name="notes"
              rows={3}
              maxLength={2000}
              defaultValue={state.values?.notes ?? ''}
            />
          </div>

          <div className="form-actions">
            <button
              className="secondary-button"
              type="button"
              onClick={() => (document.getElementById(DIALOG_ID) as HTMLDialogElement)?.close()}
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
