'use client';

import type { Risk } from '@synaptria/domain/risks';
import type { Program } from '@synaptria/domain/programs';
import type { Project } from '@synaptria/domain/projects';
import { useActionState, useCallback } from 'react';
import { useFormStatus } from 'react-dom';

import { updateRiskAction } from '../../actions/risks/update-risk';
import { initialUpdateRiskState } from '../../actions/risks/update-risk-form';

const RISK_CATEGORIES = [
  { value: 'SCIENTIFIC', label: 'Scientific' },
  { value: 'CLINICAL', label: 'Clinical' },
  { value: 'REGULATORY', label: 'Regulatory' },
  { value: 'CMC', label: 'CMC' },
  { value: 'MANUFACTURING', label: 'Manufacturing' },
  { value: 'FINANCIAL', label: 'Financial' },
  { value: 'VENDOR', label: 'Vendor' },
  { value: 'OPERATIONAL', label: 'Operational' },
  { value: 'LEGAL', label: 'Legal' },
  { value: 'IP', label: 'IP' },
  { value: 'PEOPLE', label: 'People' },
  { value: 'OTHER', label: 'Other' },
] as const;

const RISK_STATUSES = [
  { value: 'OPEN', label: 'Open' },
  { value: 'MITIGATING', label: 'Mitigating' },
  { value: 'ACCEPTED', label: 'Accepted' },
  { value: 'CLOSED', label: 'Closed' },
] as const;

const RISK_PROBABILITIES = [
  { value: 'RARE', label: 'Rare' },
  { value: 'UNLIKELY', label: 'Unlikely' },
  { value: 'POSSIBLE', label: 'Possible' },
  { value: 'LIKELY', label: 'Likely' },
  { value: 'ALMOST_CERTAIN', label: 'Almost certain' },
] as const;

const RISK_IMPACTS = [
  { value: 'NEGLIGIBLE', label: 'Negligible' },
  { value: 'MINOR', label: 'Minor' },
  { value: 'MODERATE', label: 'Moderate' },
  { value: 'MAJOR', label: 'Major' },
  { value: 'SEVERE', label: 'Severe' },
] as const;

const DIALOG_ID = 'edit-risk-dialog';

export interface EditRiskDialogProps {
  readonly risk: Risk;
  readonly programs: readonly Program[];
  readonly projects: readonly Project[];
}

export function EditRiskDialog({ risk, programs, projects }: EditRiskDialogProps) {
  const boundAction = useCallback(
    updateRiskAction.bind(null, risk.id),
    [risk.id],
  );
  const [state, formAction] = useActionState(boundAction, initialUpdateRiskState);

  const close = () => (document.getElementById(DIALOG_ID) as HTMLDialogElement)?.close();
  const open = () => (document.getElementById(DIALOG_ID) as HTMLDialogElement)?.showModal();

  return (
    <>
      <button className="secondary-button" type="button" onClick={open}>
        Edit risk
      </button>

      <dialog id={DIALOG_ID} className="organization-dialog">
        <form action={formAction} className="organization-form">
          <div className="organization-dialog-heading">
            <div>
              <p className="eyebrow">EDIT RISK</p>
              <h2>Update risk</h2>
            </div>
            <button aria-label="Close dialog" className="dialog-close-button" type="button" onClick={close}>×</button>
          </div>

          {state.status === 'error' && state.message !== undefined ? (
            <div className="form-error-summary" role="alert">{state.message}</div>
          ) : null}

          {state.status === 'success' ? (
            <div className="form-success-summary" role="status">Risk updated successfully.</div>
          ) : null}

          <div className="form-field">
            <label htmlFor="edit-risk-title">Risk title</label>
            <input
              id="edit-risk-title"
              name="title"
              type="text"
              autoComplete="off"
              required
              maxLength={200}
              defaultValue={state.values?.title ?? risk.title}
              aria-invalid={state.fieldErrors?.title !== undefined}
            />
            {state.fieldErrors?.title !== undefined ? (
              <span className="form-field-error">{state.fieldErrors.title}</span>
            ) : null}
          </div>

          <div className="form-field">
            <label htmlFor="edit-risk-category">Category</label>
            <select
              id="edit-risk-category"
              name="category"
              required
              defaultValue={state.values?.category ?? risk.category}
              aria-invalid={state.fieldErrors?.category !== undefined}
            >
              {RISK_CATEGORIES.map((c) => (
                <option key={c.value} value={c.value}>{c.label}</option>
              ))}
            </select>
          </div>

          <div className="form-field">
            <label htmlFor="edit-risk-status">Status</label>
            <select id="edit-risk-status" name="status" defaultValue={state.values?.status ?? risk.status}>
              {RISK_STATUSES.map((s) => (
                <option key={s.value} value={s.value}>{s.label}</option>
              ))}
            </select>
          </div>

          <div className="form-field">
            <label htmlFor="edit-risk-probability">Probability</label>
            <select id="edit-risk-probability" name="probability" defaultValue={state.values?.probability ?? risk.probability}>
              {RISK_PROBABILITIES.map((p) => (
                <option key={p.value} value={p.value}>{p.label}</option>
              ))}
            </select>
          </div>

          <div className="form-field">
            <label htmlFor="edit-risk-impact">Impact</label>
            <select id="edit-risk-impact" name="impact" defaultValue={state.values?.impact ?? risk.impact}>
              {RISK_IMPACTS.map((i) => (
                <option key={i.value} value={i.value}>{i.label}</option>
              ))}
            </select>
          </div>

          <div className="form-field">
            <label htmlFor="edit-risk-description">Description</label>
            <textarea
              id="edit-risk-description"
              name="description"
              rows={3}
              maxLength={2000}
              defaultValue={state.values?.description ?? (risk.description ?? '')}
            />
          </div>

          <div className="form-field">
            <label htmlFor="edit-risk-mitigation">Mitigation plan</label>
            <textarea
              id="edit-risk-mitigation"
              name="mitigationPlan"
              rows={3}
              maxLength={2000}
              defaultValue={state.values?.mitigationPlan ?? (risk.mitigationPlan ?? '')}
            />
          </div>

          <div className="form-field">
            <label htmlFor="edit-risk-contingency">Contingency plan</label>
            <textarea
              id="edit-risk-contingency"
              name="contingencyPlan"
              rows={3}
              maxLength={2000}
              defaultValue={state.values?.contingencyPlan ?? (risk.contingencyPlan ?? '')}
            />
          </div>

          {programs.length > 0 ? (
            <div className="form-field">
              <label htmlFor="edit-risk-program">Program</label>
              <select id="edit-risk-program" name="programId" defaultValue={state.values?.programId ?? (risk.programId ?? '')}>
                <option value="">None</option>
                {programs.map((p) => (
                  <option key={p.id} value={p.id}>{p.name}</option>
                ))}
              </select>
            </div>
          ) : null}

          {projects.length > 0 ? (
            <div className="form-field">
              <label htmlFor="edit-risk-project">Project</label>
              <select id="edit-risk-project" name="projectId" defaultValue={state.values?.projectId ?? (risk.projectId ?? '')}>
                <option value="">None</option>
                {projects.map((p) => (
                  <option key={p.id} value={p.id}>{p.name}</option>
                ))}
              </select>
            </div>
          ) : null}

          <div className="organization-form-actions">
            <button className="secondary-button" type="button" onClick={close}>Cancel</button>
            <EditRiskSubmitButton />
          </div>
        </form>
      </dialog>
    </>
  );
}

function EditRiskSubmitButton() {
  const { pending } = useFormStatus();
  return (
    <button className="primary-button" type="submit" disabled={pending}>
      {pending ? 'Saving…' : 'Save changes'}
    </button>
  );
}
