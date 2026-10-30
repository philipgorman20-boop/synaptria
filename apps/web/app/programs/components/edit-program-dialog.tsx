'use client';

import type { Program } from '@synaptria/domain/programs';
import { useActionState, useCallback } from 'react';
import { useFormStatus } from 'react-dom';

import { updateProgramAction } from '../../actions/programs/update-program';
import { initialUpdateProgramState } from '../../actions/programs/update-program-form';

const PROGRAM_STATUSES = [
  { value: 'CONCEPT', label: 'Concept' },
  { value: 'DISCOVERY', label: 'Discovery' },
  { value: 'PRECLINICAL', label: 'Preclinical' },
  { value: 'IND_ENABLING', label: 'IND-Enabling' },
  { value: 'CLINICAL', label: 'Clinical' },
  { value: 'PARTNERED', label: 'Partnered' },
  { value: 'ON_HOLD', label: 'On Hold' },
  { value: 'COMPLETED', label: 'Completed' },
  { value: 'TERMINATED', label: 'Terminated' },
] as const;

const PROGRAM_PRIORITIES = [
  { value: 'LOW', label: 'Low' },
  { value: 'MEDIUM', label: 'Medium' },
  { value: 'HIGH', label: 'High' },
  { value: 'CRITICAL', label: 'Critical' },
] as const;

const DIALOG_ID = 'edit-program-dialog';

export interface EditProgramDialogProps {
  readonly program: Program;
}

export function EditProgramDialog({ program }: EditProgramDialogProps) {
  const boundAction = useCallback(
    updateProgramAction.bind(null, program.id),
    [program.id],
  );
  const [state, formAction] = useActionState(boundAction, initialUpdateProgramState);

  const close = () => (globalThis.document.getElementById(DIALOG_ID) as HTMLDialogElement)?.close();
  const open = () => (globalThis.document.getElementById(DIALOG_ID) as HTMLDialogElement)?.showModal();

  return (
    <>
      <button className="secondary-button" type="button" onClick={open}>Edit program</button>

      <dialog id={DIALOG_ID} className="organization-dialog">
        <form action={formAction} className="organization-form">
          <div className="organization-dialog-heading">
            <div>
              <p className="eyebrow">EDIT PROGRAM</p>
              <h2>Update program</h2>
            </div>
            <button aria-label="Close dialog" className="dialog-close-button" type="button" onClick={close}>×</button>
          </div>

          {state.status === 'error' && state.message !== undefined ? (
            <div className="form-error-summary" role="alert">{state.message}</div>
          ) : null}
          {state.status === 'success' ? (
            <div className="form-success-summary" role="status">Program updated successfully.</div>
          ) : null}

          <div className="form-field">
            <label htmlFor="edit-program-name">Program name</label>
            <input
              id="edit-program-name"
              name="name"
              type="text"
              required
              maxLength={200}
              defaultValue={state.values?.name ?? program.name}
              aria-invalid={state.fieldErrors?.name !== undefined}
            />
            {state.fieldErrors?.name !== undefined ? (
              <span className="form-field-error">{state.fieldErrors.name}</span>
            ) : null}
          </div>

          <div className="form-field">
            <label htmlFor="edit-program-status">Status</label>
            <select id="edit-program-status" name="status" defaultValue={state.values?.status ?? program.status}>
              {PROGRAM_STATUSES.map((s) => (
                <option key={s.value} value={s.value}>{s.label}</option>
              ))}
            </select>
          </div>

          <div className="form-field">
            <label htmlFor="edit-program-priority">Priority</label>
            <select id="edit-program-priority" name="priority" defaultValue={state.values?.priority ?? program.priority}>
              {PROGRAM_PRIORITIES.map((p) => (
                <option key={p.value} value={p.value}>{p.label}</option>
              ))}
            </select>
          </div>

          <div className="form-field">
            <label htmlFor="edit-program-description">Description</label>
            <textarea
              id="edit-program-description"
              name="description"
              rows={3}
              maxLength={2000}
              defaultValue={state.values?.description ?? (program.description ?? '')}
            />
          </div>

          <div className="form-field">
            <label htmlFor="edit-program-indication">Indication</label>
            <input
              id="edit-program-indication"
              name="indication"
              type="text"
              maxLength={200}
              defaultValue={state.values?.indication ?? (program.indication ?? '')}
            />
          </div>

          <div className="form-field">
            <label htmlFor="edit-program-modality">Modality</label>
            <input
              id="edit-program-modality"
              name="modality"
              type="text"
              maxLength={200}
              defaultValue={state.values?.modality ?? (program.modality ?? '')}
            />
          </div>

          <div className="form-field">
            <label htmlFor="edit-program-target">Target</label>
            <input
              id="edit-program-target"
              name="target"
              type="text"
              maxLength={200}
              defaultValue={state.values?.target ?? (program.target ?? '')}
            />
          </div>

          <div className="organization-form-actions">
            <button className="secondary-button" type="button" onClick={close}>Cancel</button>
            <EditProgramSubmitButton />
          </div>
        </form>
      </dialog>
    </>
  );
}

function EditProgramSubmitButton() {
  const { pending } = useFormStatus();
  return (
    <button className="primary-button" type="submit" disabled={pending}>
      {pending ? 'Saving…' : 'Save changes'}
    </button>
  );
}
