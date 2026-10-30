'use client';

import type { Program } from '@synaptria/domain/programs';
import type { Project } from '@synaptria/domain/projects';
import { useActionState, useCallback } from 'react';
import { useFormStatus } from 'react-dom';

import { updateProjectAction } from '../../actions/projects/update-project';
import { initialUpdateProjectState } from '../../actions/projects/update-project-form';

const PROJECT_STATUSES = [
  { value: 'PLANNED', label: 'Planned' },
  { value: 'ACTIVE', label: 'Active' },
  { value: 'ON_HOLD', label: 'On Hold' },
  { value: 'COMPLETED', label: 'Completed' },
  { value: 'CANCELLED', label: 'Cancelled' },
] as const;

const PROJECT_PRIORITIES = [
  { value: 'LOW', label: 'Low' },
  { value: 'MEDIUM', label: 'Medium' },
  { value: 'HIGH', label: 'High' },
  { value: 'CRITICAL', label: 'Critical' },
] as const;

const DIALOG_ID = 'edit-project-dialog';

export interface EditProjectDialogProps {
  readonly project: Project;
  readonly programs: readonly Program[];
}

export function EditProjectDialog({ project, programs }: EditProjectDialogProps) {
  const boundAction = useCallback(
    updateProjectAction.bind(null, project.id),
    [project.id],
  );
  const [state, formAction] = useActionState(boundAction, initialUpdateProjectState);

  const close = () => (globalThis.document.getElementById(DIALOG_ID) as HTMLDialogElement)?.close();
  const open = () => (globalThis.document.getElementById(DIALOG_ID) as HTMLDialogElement)?.showModal();

  return (
    <>
      <button className="secondary-button" type="button" onClick={open}>Edit project</button>

      <dialog id={DIALOG_ID} className="organization-dialog">
        <form action={formAction} className="organization-form">
          <div className="organization-dialog-heading">
            <div>
              <p className="eyebrow">EDIT PROJECT</p>
              <h2>Update project</h2>
            </div>
            <button aria-label="Close dialog" className="dialog-close-button" type="button" onClick={close}>×</button>
          </div>

          {state.status === 'error' && state.message !== undefined ? (
            <div className="form-error-summary" role="alert">{state.message}</div>
          ) : null}
          {state.status === 'success' ? (
            <div className="form-success-summary" role="status">Project updated successfully.</div>
          ) : null}

          <div className="form-field">
            <label htmlFor="edit-project-name">Project name</label>
            <input
              id="edit-project-name"
              name="name"
              type="text"
              required
              maxLength={200}
              defaultValue={state.values?.name ?? project.name}
              aria-invalid={state.fieldErrors?.name !== undefined}
            />
            {state.fieldErrors?.name !== undefined ? (
              <span className="form-field-error">{state.fieldErrors.name}</span>
            ) : null}
          </div>

          <div className="form-field">
            <label htmlFor="edit-project-status">Status</label>
            <select id="edit-project-status" name="status" defaultValue={state.values?.status ?? project.status}>
              {PROJECT_STATUSES.map((s) => (
                <option key={s.value} value={s.value}>{s.label}</option>
              ))}
            </select>
          </div>

          <div className="form-field">
            <label htmlFor="edit-project-priority">Priority</label>
            <select id="edit-project-priority" name="priority" defaultValue={state.values?.priority ?? project.priority}>
              {PROJECT_PRIORITIES.map((p) => (
                <option key={p.value} value={p.value}>{p.label}</option>
              ))}
            </select>
          </div>

          <div className="form-field">
            <label htmlFor="edit-project-percent">Percent complete</label>
            <input
              id="edit-project-percent"
              name="percentComplete"
              type="number"
              min={0}
              max={100}
              defaultValue={state.values?.percentComplete ?? String(project.percentComplete)}
              aria-invalid={state.fieldErrors?.percentComplete !== undefined}
            />
            {state.fieldErrors?.percentComplete !== undefined ? (
              <span className="form-field-error">{state.fieldErrors.percentComplete}</span>
            ) : null}
          </div>

          <div className="form-field">
            <label htmlFor="edit-project-description">Description</label>
            <textarea
              id="edit-project-description"
              name="description"
              rows={3}
              maxLength={2000}
              defaultValue={state.values?.description ?? (project.description ?? '')}
            />
          </div>

          {programs.length > 0 ? (
            <div className="form-field">
              <label htmlFor="edit-project-program">Program</label>
              <select id="edit-project-program" name="programId" defaultValue={state.values?.programId ?? (project.programId ?? '')}>
                <option value="">None</option>
                {programs.map((p) => (
                  <option key={p.id} value={p.id}>{p.name}</option>
                ))}
              </select>
            </div>
          ) : null}

          <div className="organization-form-actions">
            <button className="secondary-button" type="button" onClick={close}>Cancel</button>
            <EditProjectSubmitButton />
          </div>
        </form>
      </dialog>
    </>
  );
}

function EditProjectSubmitButton() {
  const { pending } = useFormStatus();
  return (
    <button className="primary-button" type="submit" disabled={pending}>
      {pending ? 'Saving…' : 'Save changes'}
    </button>
  );
}
