'use client';

import { useActionState } from 'react';
import { useFormStatus } from 'react-dom';

import { createVendorAction } from '../../actions/vendors/create-vendor';
import { initialCreateVendorState } from '../../actions/vendors/create-vendor-form';

const VENDOR_CATEGORIES = [
  { value: 'CRO', label: 'CRO' },
  { value: 'CDMO', label: 'CDMO' },
  { value: 'CONSULTANT', label: 'Consultant' },
  { value: 'LEGAL', label: 'Legal' },
  { value: 'REGULATORY', label: 'Regulatory' },
  { value: 'CLINICAL', label: 'Clinical' },
  { value: 'SOFTWARE', label: 'Software' },
  { value: 'EQUIPMENT', label: 'Equipment' },
  { value: 'LAB_SUPPLIES', label: 'Lab Supplies' },
  { value: 'FACILITIES', label: 'Facilities' },
  { value: 'FINANCE', label: 'Finance' },
  { value: 'HR', label: 'HR' },
  { value: 'OTHER', label: 'Other' },
] as const;

export function CreateVendorDialog() {
  const [state, formAction] = useActionState(createVendorAction, initialCreateVendorState);

  return (
    <>
      <button
        className="primary-button"
        type="button"
        onClick={() => (document.getElementById('create-vendor-dialog') as HTMLDialogElement)?.showModal()}
      >
        Add vendor
      </button>

      <dialog id="create-vendor-dialog" className="organization-dialog">
        <form action={formAction} className="organization-form">
          <div className="organization-dialog-heading">
            <div>
              <p className="eyebrow">NEW VENDOR</p>
              <h2>Add a vendor</h2>
              <p>Add an external partner or supplier to your vendor registry.</p>
            </div>
            <button
              aria-label="Close dialog"
              className="dialog-close-button"
              type="button"
              onClick={() => (document.getElementById('create-vendor-dialog') as HTMLDialogElement)?.close()}
            >
              ×
            </button>
          </div>

          {state.status === 'error' && state.message !== undefined ? (
            <div className="form-error-summary" role="alert">{state.message}</div>
          ) : null}

          <div className="form-field">
            <label htmlFor="vendor-name">Vendor name</label>
            <input
              id="vendor-name"
              name="name"
              type="text"
              autoComplete="off"
              autoFocus
              required
              maxLength={200}
              defaultValue={state.values?.name ?? ''}
              aria-invalid={state.fieldErrors?.name !== undefined}
              placeholder="Covance Inc."
            />
            {state.fieldErrors?.name !== undefined ? (
              <span className="form-field-error">{state.fieldErrors.name}</span>
            ) : null}
          </div>

          <div className="form-field">
            <label htmlFor="vendor-category">Category</label>
            <select
              id="vendor-category"
              name="category"
              required
              defaultValue={state.values?.category ?? ''}
              aria-invalid={state.fieldErrors?.category !== undefined}
            >
              <option value="">Select a category</option>
              {VENDOR_CATEGORIES.map((c) => (
                <option key={c.value} value={c.value}>{c.label}</option>
              ))}
            </select>
            {state.fieldErrors?.category !== undefined ? (
              <span className="form-field-error">{state.fieldErrors.category}</span>
            ) : null}
          </div>

          <div className="form-field">
            <label htmlFor="vendor-website">Website</label>
            <input
              id="vendor-website"
              name="website"
              type="url"
              maxLength={500}
              defaultValue={state.values?.website ?? ''}
              placeholder="https://covance.com"
            />
          </div>

          <div className="form-field">
            <label htmlFor="vendor-country">Country</label>
            <input
              id="vendor-country"
              name="country"
              type="text"
              maxLength={100}
              defaultValue={state.values?.country ?? ''}
              placeholder="United States"
            />
          </div>

          <div className="organization-form-actions">
            <button
              className="secondary-button"
              type="button"
              onClick={() => (document.getElementById('create-vendor-dialog') as HTMLDialogElement)?.close()}
            >
              Cancel
            </button>
            <CreateVendorSubmitButton />
          </div>
        </form>
      </dialog>
    </>
  );
}

function CreateVendorSubmitButton() {
  const { pending } = useFormStatus();
  return (
    <button className="primary-button" type="submit" disabled={pending}>
      {pending ? 'Adding…' : 'Add vendor'}
    </button>
  );
}
