'use client';

import { useActionState } from 'react';
import { useFormStatus } from 'react-dom';
import type { Program } from '@synaptria/domain/programs';
import type { Project } from '@synaptria/domain/projects';

import { createRiskAction } from '../../actions/risks/create-risk';
import { initialCreateRiskState } from '../../actions/risks/create-risk-form';

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

interface CreateRiskDialogProps {
  readonly programs: readonly Program[];
  readonly projects: readonly Project[];
}

export function CreateRiskDialog({ programs, projects }: CreateRiskDialogProps) {
  const [state, formAction] = useActionState(createRiskAction, initialCreateRiskState);

  return (
    <>
      <button
        className="primary-button"
        type="button"
        onClick={() => (document.getElementById('create-risk-dialog') as HTMLDialogElement)?.showModal()}
      >
        Add risk
      </button>

      <dialog id="create-risk-dialog" className="organization-dialog">
        <form action={formAction} className="organization-form">
          <div className="organization-dialog-heading">
            <div>
              <p className="eyebrow">NEW RISK</p>
              <h2>Add a risk</h2>
              <p>Track a risk that could affect program or project outcomes.</p>
            </div>
            <button
              aria-label="Close dialog"
              className="dialog-close-button"
              type="button"
              onClick={() => (document.getElementById('create-risk-dialog') as HTMLDialogElement)?.close()}
            >
              ×
            </button>
          </div>

          {state.status === 'error' && state.message !== undefined ? (
            <div className="form-error-summary" role="alert">{state.message}</div>
          ) : null}

          <div className="form-field">
            <label htmlFor="risk-title">Risk title</label>
            <input
              id="risk-title"
              name="title"
              type="text"
              autoComplete="off"
              autoFocus
              required
              maxLength={200}
              defaultValue={state.values?.title ?? ''}
              aria-invalid={state.fieldErrors?.title !== undefined}
              placeholder="Phase 2 trial enrollment delay"
            />
            {state.fieldErrors?.title !== undefined ? (
              <span className="form-field-error">{state.fieldErrors.title}</span>
            ) : null}
          </div>

          <div className="form-field">
            <label htmlFor="risk-category">Category</label>
            <select
              id="risk-category"
              name="category"
              required
              defaultValue={state.values?.category ?? ''}
              aria-invalid={state.fieldErrors?.category !== undefined}
            >
              <option value="">Select a category</option>
              {RISK_CATEGORIES.map((c) => (
                <option key={c.value} value={c.value}>{c.label}</option>
              ))}
            </select>
            {state.fieldErrors?.category !== undefined ? (
              <span className="form-field-error">{state.fieldErrors.category}</span>
            ) : null}
          </div>

          <div className="form-field">
            <label htmlFor="risk-description">Description</label>
            <textarea
              id="risk-description"
              name="description"
              rows={3}
              maxLength={2000}
              defaultValue={state.values?.description ?? ''}
              placeholder="Describe the risk and its potential impact."
            />
          </div>

          {programs.length > 0 ? (
            <div className="form-field">
              <label htmlFor="risk-program">Program</label>
              <select id="risk-program" name="programId" defaultValue={state.values?.programId ?? ''}>
                <option value="">None</option>
                {programs.map((p) => (
                  <option key={p.id} value={p.id}>{p.name}</option>
                ))}
              </select>
            </div>
          ) : null}

          {projects.length > 0 ? (
            <div className="form-field">
              <label htmlFor="risk-project">Project</label>
              <select id="risk-project" name="projectId" defaultValue={state.values?.projectId ?? ''}>
                <option value="">None</option>
                {projects.map((p) => (
                  <option key={p.id} value={p.id}>{p.name}</option>
                ))}
              </select>
            </div>
          ) : null}

          <div className="organization-form-actions">
            <button
              className="secondary-button"
              type="button"
              onClick={() => (document.getElementById('create-risk-dialog') as HTMLDialogElement)?.close()}
            >
              Cancel
            </button>
            <CreateRiskSubmitButton />
          </div>
        </form>
      </dialog>
    </>
  );
}

function CreateRiskSubmitButton() {
  const { pending } = useFormStatus();
  return (
    <button className="primary-button" type="submit" disabled={pending}>
      {pending ? 'Adding…' : 'Add risk'}
    </button>
  );
}
