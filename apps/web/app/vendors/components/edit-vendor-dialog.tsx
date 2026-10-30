'use client';

import type { Vendor } from '@synaptria/domain/vendors';
import { useActionState, useCallback } from 'react';
import { useFormStatus } from 'react-dom';

import { updateVendorAction } from '../../actions/vendors/update-vendor';
import { initialUpdateVendorState } from '../../actions/vendors/update-vendor-form';

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

const VENDOR_STATUSES = [
  { value: 'PROSPECTIVE', label: 'Prospective' },
  { value: 'QUALIFYING', label: 'Qualifying' },
  { value: 'APPROVED', label: 'Approved' },
  { value: 'ACTIVE', label: 'Active' },
  { value: 'SUSPENDED', label: 'Suspended' },
  { value: 'INACTIVE', label: 'Inactive' },
  { value: 'ARCHIVED', label: 'Archived' },
] as const;

const DIALOG_ID = 'edit-vendor-dialog';

export interface EditVendorDialogProps {
  readonly vendor: Vendor;
}

export function EditVendorDialog({ vendor }: EditVendorDialogProps) {
  const boundAction = useCallback(
    updateVendorAction.bind(null, vendor.id),
    [vendor.id],
  );
  const [state, formAction] = useActionState(boundAction, initialUpdateVendorState);

  const close = () => (document.getElementById(DIALOG_ID) as HTMLDialogElement)?.close();
  const open = () => (document.getElementById(DIALOG_ID) as HTMLDialogElement)?.showModal();

  return (
    <>
      <button className="secondary-button" type="button" onClick={open}>Edit vendor</button>

      <dialog id={DIALOG_ID} className="organization-dialog">
        <form action={formAction} className="organization-form">
          <div className="organization-dialog-heading">
            <div>
              <p className="eyebrow">EDIT VENDOR</p>
              <h2>Update vendor</h2>
            </div>
            <button aria-label="Close dialog" className="dialog-close-button" type="button" onClick={close}>×</button>
          </div>

          {state.status === 'error' && state.message !== undefined ? (
            <div className="form-error-summary" role="alert">{state.message}</div>
          ) : null}
          {state.status === 'success' ? (
            <div className="form-success-summary" role="status">Vendor updated successfully.</div>
          ) : null}

          <div className="form-field">
            <label htmlFor="edit-vendor-name">Vendor name</label>
            <input
              id="edit-vendor-name"
              name="name"
              type="text"
              required
              maxLength={200}
              defaultValue={state.values?.name ?? vendor.name}
              aria-invalid={state.fieldErrors?.name !== undefined}
            />
            {state.fieldErrors?.name !== undefined ? (
              <span className="form-field-error">{state.fieldErrors.name}</span>
            ) : null}
          </div>

          <div className="form-field">
            <label htmlFor="edit-vendor-category">Category</label>
            <select
              id="edit-vendor-category"
              name="category"
              required
              defaultValue={state.values?.category ?? vendor.category}
              aria-invalid={state.fieldErrors?.category !== undefined}
            >
              {VENDOR_CATEGORIES.map((c) => (
                <option key={c.value} value={c.value}>{c.label}</option>
              ))}
            </select>
          </div>

          <div className="form-field">
            <label htmlFor="edit-vendor-status">Status</label>
            <select id="edit-vendor-status" name="status" defaultValue={state.values?.status ?? vendor.status}>
              {VENDOR_STATUSES.map((s) => (
                <option key={s.value} value={s.value}>{s.label}</option>
              ))}
            </select>
          </div>

          <div className="form-field">
            <label htmlFor="edit-vendor-website">Website</label>
            <input
              id="edit-vendor-website"
              name="website"
              type="url"
              maxLength={500}
              defaultValue={state.values?.website ?? (vendor.website ?? '')}
            />
          </div>

          <div className="form-field">
            <label htmlFor="edit-vendor-email">Email</label>
            <input
              id="edit-vendor-email"
              name="email"
              type="email"
              maxLength={200}
              defaultValue={state.values?.email ?? (vendor.email ?? '')}
            />
          </div>

          <div className="form-field">
            <label htmlFor="edit-vendor-phone">Phone</label>
            <input
              id="edit-vendor-phone"
              name="phone"
              type="text"
              maxLength={50}
              defaultValue={state.values?.phone ?? (vendor.phone ?? '')}
            />
          </div>

          <div className="form-field">
            <label htmlFor="edit-vendor-country">Country</label>
            <input
              id="edit-vendor-country"
              name="country"
              type="text"
              maxLength={100}
              defaultValue={state.values?.country ?? (vendor.country ?? '')}
            />
          </div>

          <div className="form-field">
            <label htmlFor="edit-vendor-city">City</label>
            <input
              id="edit-vendor-city"
              name="city"
              type="text"
              maxLength={100}
              defaultValue={state.values?.city ?? (vendor.city ?? '')}
            />
          </div>

          <div className="form-field">
            <label htmlFor="edit-vendor-notes">Notes</label>
            <textarea
              id="edit-vendor-notes"
              name="notes"
              rows={3}
              maxLength={2000}
              defaultValue={state.values?.notes ?? (vendor.notes ?? '')}
            />
          </div>

          <div className="organization-form-actions">
            <button className="secondary-button" type="button" onClick={close}>Cancel</button>
            <EditVendorSubmitButton />
          </div>
        </form>
      </dialog>
    </>
  );
}

function EditVendorSubmitButton() {
  const { pending } = useFormStatus();
  return (
    <button className="primary-button" type="submit" disabled={pending}>
      {pending ? 'Saving…' : 'Save changes'}
    </button>
  );
}
