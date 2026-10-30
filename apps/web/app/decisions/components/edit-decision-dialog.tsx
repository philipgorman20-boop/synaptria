'use client';

import type { Decision } from '@synaptria/domain/decisions';
import type { Program } from '@synaptria/domain/programs';
import type { Project } from '@synaptria/domain/projects';
import { useActionState, useCallback } from 'react';
import { useFormStatus } from 'react-dom';

import { updateDecisionAction } from '../../actions/decisions/update-decision';
import { initialUpdateDecisionState } from '../../actions/decisions/update-decision-form';

const DECISION_STATUSES = [
  { value: 'PROPOSED', label: 'Proposed' },
  { value: 'APPROVED', label: 'Approved' },
  { value: 'REJECTED', label: 'Rejected' },
  { value: 'SUPERSEDED', label: 'Superseded' },
] as const;

const DIALOG_ID = 'edit-decision-dialog';

function toDateInput(date: Date | undefined): string {
  if (date === undefined) return '';
  return date.toISOString().slice(0, 10);
}

export interface EditDecisionDialogProps {
  readonly decision: Decision;
  readonly programs: readonly Program[];
  readonly projects: readonly Project[];
}

export function EditDecisionDialog({ decision, programs, projects }: EditDecisionDialogProps) {
  const boundAction = useCallback(
    updateDecisionAction.bind(null, decision.id),
    [decision.id],
  );
  const [state, formAction] = useActionState(boundAction, initialUpdateDecisionState);

  const close = () => (document.getElementById(DIALOG_ID) as HTMLDialogElement)?.close();
  const open = () => (document.getElementById(DIALOG_ID) as HTMLDialogElement)?.showModal();

  return (
    <>
      <button className="secondary-button" type="button" onClick={open}>Edit decision</button>

      <dialog id={DIALOG_ID} className="organization-dialog">
        <form action={formAction} className="organization-form">
          <div className="organization-dialog-heading">
            <div>
              <p className="eyebrow">EDIT DECISION</p>
              <h2>Update decision</h2>
            </div>
            <button aria-label="Close dialog" className="dialog-close-button" type="button" onClick={close}>×</button>
          </div>

          {state.status === 'error' && state.message !== undefined ? (
            <div className="form-error-summary" role="alert">{state.message}</div>
          ) : null}
          {state.status === 'success' ? (
            <div className="form-success-summary" role="status">Decision updated successfully.</div>
          ) : null}

          <div className="form-field">
            <label htmlFor="edit-decision-title">Title</label>
            <input
              id="edit-decision-title"
              name="title"
              type="text"
              required
              maxLength={200}
              defaultValue={state.values?.title ?? decision.title}
              aria-invalid={state.fieldErrors?.title !== undefined}
            />
            {state.fieldErrors?.title !== undefined ? (
              <span className="form-field-error">{state.fieldErrors.title}</span>
            ) : null}
          </div>

          <div className="form-field">
            <label htmlFor="edit-decision-status">Status</label>
            <select id="edit-decision-status" name="status" defaultValue={state.values?.status ?? decision.status}>
              {DECISION_STATUSES.map((s) => (
                <option key={s.value} value={s.value}>{s.label}</option>
              ))}
            </select>
          </div>

          <div className="form-field">
            <label htmlFor="edit-decision-context">Context</label>
            <textarea
              id="edit-decision-context"
              name="context"
              rows={2}
              maxLength={2000}
              defaultValue={state.values?.context ?? (decision.context ?? '')}
            />
          </div>

          <div className="form-field">
            <label htmlFor="edit-decision-decision">Decision</label>
            <textarea
              id="edit-decision-decision"
              name="decision"
              rows={3}
              maxLength={2000}
              defaultValue={state.values?.decision ?? (decision.decision ?? '')}
            />
          </div>

          <div className="form-field">
            <label htmlFor="edit-decision-rationale">Rationale</label>
            <textarea
              id="edit-decision-rationale"
              name="rationale"
              rows={3}
              maxLength={2000}
              defaultValue={state.values?.rationale ?? (decision.rationale ?? '')}
            />
          </div>

          <div className="form-field">
            <label htmlFor="edit-decision-alternatives">Alternatives considered</label>
            <textarea
              id="edit-decision-alternatives"
              name="alternatives"
              rows={2}
              maxLength={2000}
              defaultValue={state.values?.alternatives ?? (decision.alternatives ?? '')}
            />
          </div>

          <div className="form-field">
            <label htmlFor="edit-decision-date">Decision date</label>
            <input
              id="edit-decision-date"
              name="decisionDate"
              type="date"
              defaultValue={state.values?.decisionDate ?? toDateInput(decision.decisionDate)}
            />
          </div>

          <div className="form-field">
            <label htmlFor="edit-decision-effective">Effective date</label>
            <input
              id="edit-decision-effective"
              name="effectiveDate"
              type="date"
              defaultValue={state.values?.effectiveDate ?? toDateInput(decision.effectiveDate)}
            />
          </div>

          {programs.length > 0 ? (
            <div className="form-field">
              <label htmlFor="edit-decision-program">Program</label>
              <select id="edit-decision-program" name="programId" defaultValue={state.values?.programId ?? (decision.programId ?? '')}>
                <option value="">None</option>
                {programs.map((p) => (
                  <option key={p.id} value={p.id}>{p.name}</option>
                ))}
              </select>
            </div>
          ) : null}

          {projects.length > 0 ? (
            <div className="form-field">
              <label htmlFor="edit-decision-project">Project</label>
              <select id="edit-decision-project" name="projectId" defaultValue={state.values?.projectId ?? (decision.projectId ?? '')}>
                <option value="">None</option>
                {projects.map((p) => (
                  <option key={p.id} value={p.id}>{p.name}</option>
                ))}
              </select>
            </div>
          ) : null}

          <div className="organization-form-actions">
            <button className="secondary-button" type="button" onClick={close}>Cancel</button>
            <EditDecisionSubmitButton />
          </div>
        </form>
      </dialog>
    </>
  );
}

function EditDecisionSubmitButton() {
  const { pending } = useFormStatus();
  return (
    <button className="primary-button" type="submit" disabled={pending}>
      {pending ? 'Saving…' : 'Save changes'}
    </button>
  );
}
