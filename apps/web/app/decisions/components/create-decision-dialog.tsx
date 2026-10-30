'use client';

import { useActionState } from 'react';
import { useFormStatus } from 'react-dom';
import type { Program } from '@synaptria/domain/programs';
import type { Project } from '@synaptria/domain/projects';

import { createDecisionAction } from '../../actions/decisions/create-decision';
import { initialCreateDecisionState } from '../../actions/decisions/create-decision-form';

interface CreateDecisionDialogProps {
  readonly programs: readonly Program[];
  readonly projects: readonly Project[];
}

export function CreateDecisionDialog({ programs, projects }: CreateDecisionDialogProps) {
  const [state, formAction] = useActionState(createDecisionAction, initialCreateDecisionState);

  return (
    <>
      <button
        className="primary-button"
        type="button"
        onClick={() => (document.getElementById('create-decision-dialog') as HTMLDialogElement)?.showModal()}
      >
        Log decision
      </button>

      <dialog id="create-decision-dialog" className="organization-dialog">
        <form action={formAction} className="organization-form">
          <div className="organization-dialog-heading">
            <div>
              <p className="eyebrow">NEW DECISION</p>
              <h2>Log a decision</h2>
              <p>Record a key decision made for your programs or projects.</p>
            </div>
            <button
              aria-label="Close dialog"
              className="dialog-close-button"
              type="button"
              onClick={() => (document.getElementById('create-decision-dialog') as HTMLDialogElement)?.close()}
            >
              ×
            </button>
          </div>

          {state.status === 'error' && state.message !== undefined ? (
            <div className="form-error-summary" role="alert">{state.message}</div>
          ) : null}

          <div className="form-field">
            <label htmlFor="decision-title">Title</label>
            <input
              id="decision-title"
              name="title"
              type="text"
              autoComplete="off"
              autoFocus
              required
              maxLength={200}
              defaultValue={state.values?.title ?? ''}
              aria-invalid={state.fieldErrors?.title !== undefined}
              placeholder="Select Phase 2 CRO partner"
            />
            {state.fieldErrors?.title !== undefined ? (
              <span className="form-field-error">{state.fieldErrors.title}</span>
            ) : null}
          </div>

          <div className="form-field">
            <label htmlFor="decision-context">Context</label>
            <textarea
              id="decision-context"
              name="context"
              rows={3}
              maxLength={2000}
              defaultValue={state.values?.context ?? ''}
              placeholder="Background and situation that led to this decision."
            />
          </div>

          <div className="form-field">
            <label htmlFor="decision-decision">Decision</label>
            <textarea
              id="decision-decision"
              name="decision"
              rows={3}
              maxLength={2000}
              defaultValue={state.values?.decision ?? ''}
              placeholder="What was decided."
            />
          </div>

          <div className="form-field">
            <label htmlFor="decision-rationale">Rationale</label>
            <textarea
              id="decision-rationale"
              name="rationale"
              rows={3}
              maxLength={2000}
              defaultValue={state.values?.rationale ?? ''}
              placeholder="Why this decision was made."
            />
          </div>

          {programs.length > 0 ? (
            <div className="form-field">
              <label htmlFor="decision-program">Program</label>
              <select id="decision-program" name="programId" defaultValue={state.values?.programId ?? ''}>
                <option value="">None</option>
                {programs.map((p) => (
                  <option key={p.id} value={p.id}>{p.name}</option>
                ))}
              </select>
            </div>
          ) : null}

          {projects.length > 0 ? (
            <div className="form-field">
              <label htmlFor="decision-project">Project</label>
              <select id="decision-project" name="projectId" defaultValue={state.values?.projectId ?? ''}>
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
              onClick={() => (document.getElementById('create-decision-dialog') as HTMLDialogElement)?.close()}
            >
              Cancel
            </button>
            <CreateDecisionSubmitButton />
          </div>
        </form>
      </dialog>
    </>
  );
}

function CreateDecisionSubmitButton() {
  const { pending } = useFormStatus();
  return (
    <button className="primary-button" type="submit" disabled={pending}>
      {pending ? 'Logging…' : 'Log decision'}
    </button>
  );
}
