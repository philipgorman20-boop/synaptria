'use client';

import { useActionState } from 'react';
import { useFormStatus } from 'react-dom';
import type { Program } from '@synaptria/domain/programs';
import type { Project } from '@synaptria/domain/projects';

import { createDocumentAction } from '../../actions/documents/create-document';
import { initialCreateDocumentState } from '../../actions/documents/create-document-form';

const DOCUMENT_TYPES = [
  { value: 'GENERAL', label: 'General' },
  { value: 'CONTRACT', label: 'Contract' },
  { value: 'SOW', label: 'Statement of Work' },
  { value: 'QUOTE', label: 'Quote' },
  { value: 'PURCHASE_ORDER', label: 'Purchase Order' },
  { value: 'INVOICE', label: 'Invoice' },
  { value: 'PROTOCOL', label: 'Protocol' },
  { value: 'REPORT', label: 'Report' },
  { value: 'PRESENTATION', label: 'Presentation' },
  { value: 'MEETING_NOTES', label: 'Meeting Notes' },
  { value: 'BOARD_MATERIAL', label: 'Board Material' },
  { value: 'INVESTOR_MATERIAL', label: 'Investor Material' },
  { value: 'REGULATORY', label: 'Regulatory' },
  { value: 'IP', label: 'IP / Patent' },
  { value: 'POLICY', label: 'Policy' },
  { value: 'OTHER', label: 'Other' },
] as const;

interface CreateDocumentDialogProps {
  readonly programs: readonly Program[];
  readonly projects: readonly Project[];
  readonly lockedProgramId?: string | undefined;
  readonly lockedProjectId?: string | undefined;
}

export function CreateDocumentDialog({ programs, projects, lockedProgramId, lockedProjectId }: CreateDocumentDialogProps) {
  const [state, formAction] = useActionState(createDocumentAction, initialCreateDocumentState);

  return (
    <>
      <button
        className="primary-button"
        type="button"
        onClick={() => (document.getElementById('create-document-dialog') as HTMLDialogElement)?.showModal()}
      >
        Add document
      </button>

      <dialog id="create-document-dialog" className="organization-dialog">
        <form action={formAction} className="organization-form">
          <div className="organization-dialog-heading">
            <div>
              <p className="eyebrow">NEW DOCUMENT</p>
              <h2>Register a document</h2>
              <p>Add a document or external link to your organization&apos;s document registry.</p>
            </div>
            <button
              aria-label="Close dialog"
              className="dialog-close-button"
              type="button"
              onClick={() => (document.getElementById('create-document-dialog') as HTMLDialogElement)?.close()}
            >
              ×
            </button>
          </div>

          {state.status === 'error' && state.message !== undefined ? (
            <div className="form-error-summary" role="alert">{state.message}</div>
          ) : null}

          {lockedProgramId !== undefined ? (
            <input type="hidden" name="programId" value={lockedProgramId} />
          ) : null}

          {lockedProjectId !== undefined ? (
            <input type="hidden" name="projectId" value={lockedProjectId} />
          ) : null}

          <div className="form-field">
            <label htmlFor="document-title">Title</label>
            <input
              id="document-title"
              name="title"
              type="text"
              autoComplete="off"
              autoFocus
              required
              maxLength={300}
              defaultValue={state.values?.title ?? ''}
              aria-invalid={state.fieldErrors?.title !== undefined}
              placeholder="Q3 CRO Master Services Agreement"
            />
            {state.fieldErrors?.title !== undefined ? (
              <span className="form-field-error">{state.fieldErrors.title}</span>
            ) : null}
          </div>

          <div className="form-field">
            <label htmlFor="document-type">Type</label>
            <select
              id="document-type"
              name="type"
              required
              defaultValue={state.values?.type ?? ''}
              aria-invalid={state.fieldErrors?.type !== undefined}
            >
              <option value="">Select a document type</option>
              {DOCUMENT_TYPES.map((t) => (
                <option key={t.value} value={t.value}>{t.label}</option>
              ))}
            </select>
            {state.fieldErrors?.type !== undefined ? (
              <span className="form-field-error">{state.fieldErrors.type}</span>
            ) : null}
          </div>

          <div className="form-field">
            <label htmlFor="document-description">Description</label>
            <textarea
              id="document-description"
              name="description"
              rows={3}
              maxLength={1000}
              defaultValue={state.values?.description ?? ''}
              placeholder="Brief description of this document…"
            />
          </div>

          <div className="form-field">
            <label htmlFor="document-source-url">Source URL</label>
            <input
              id="document-source-url"
              name="sourceUrl"
              type="url"
              maxLength={1000}
              defaultValue={state.values?.sourceUrl ?? ''}
              aria-invalid={state.fieldErrors?.sourceUrl !== undefined}
              placeholder="https://drive.google.com/…"
            />
            {state.fieldErrors?.sourceUrl !== undefined ? (
              <span className="form-field-error">{state.fieldErrors.sourceUrl}</span>
            ) : null}
          </div>

          {lockedProgramId === undefined && programs.length > 0 ? (
            <div className="form-field">
              <label htmlFor="document-program">Program</label>
              <select id="document-program" name="programId" defaultValue={state.values?.programId ?? ''}>
                <option value="">None</option>
                {programs.map((p) => (
                  <option key={p.id} value={p.id}>{p.name}</option>
                ))}
              </select>
            </div>
          ) : null}

          {lockedProjectId === undefined && projects.length > 0 ? (
            <div className="form-field">
              <label htmlFor="document-project">Project</label>
              <select id="document-project" name="projectId" defaultValue={state.values?.projectId ?? ''}>
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
              onClick={() => (document.getElementById('create-document-dialog') as HTMLDialogElement)?.close()}
            >
              Cancel
            </button>
            <CreateDocumentSubmitButton />
          </div>
        </form>
      </dialog>
    </>
  );
}

function CreateDocumentSubmitButton() {
  const { pending } = useFormStatus();
  return (
    <button className="primary-button" type="submit" disabled={pending}>
      {pending ? 'Registering…' : 'Register document'}
    </button>
  );
}
