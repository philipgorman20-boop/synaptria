'use client';

import type { Document } from '@synaptria/domain/documents';
import type { Program } from '@synaptria/domain/programs';
import type { Project } from '@synaptria/domain/projects';
import { useActionState, useCallback } from 'react';
import { useFormStatus } from 'react-dom';

import { updateDocumentAction } from '../../actions/documents/update-document';
import { initialUpdateDocumentState } from '../../actions/documents/update-document-form';

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

const DOCUMENT_STATUSES = [
  { value: 'DRAFT', label: 'Draft' },
  { value: 'ACTIVE', label: 'Active' },
  { value: 'SUPERSEDED', label: 'Superseded' },
  { value: 'ARCHIVED', label: 'Archived' },
] as const;

const DIALOG_ID = 'edit-document-dialog';

export interface EditDocumentDialogProps {
  readonly document: Document;
  readonly programs: readonly Program[];
  readonly projects: readonly Project[];
}

export function EditDocumentDialog({ document: doc, programs, projects }: EditDocumentDialogProps) {
  const boundAction = useCallback(
    updateDocumentAction.bind(null, doc.id),
    [doc.id],
  );
  const [state, formAction] = useActionState(boundAction, initialUpdateDocumentState);

  const close = () => (globalThis.document.getElementById(DIALOG_ID) as HTMLDialogElement)?.close();
  const open = () => (globalThis.document.getElementById(DIALOG_ID) as HTMLDialogElement)?.showModal();

  return (
    <>
      <button className="secondary-button" type="button" onClick={open}>Edit document</button>

      <dialog id={DIALOG_ID} className="organization-dialog">
        <form action={formAction} className="organization-form">
          <div className="organization-dialog-heading">
            <div>
              <p className="eyebrow">EDIT DOCUMENT</p>
              <h2>Update document</h2>
            </div>
            <button aria-label="Close dialog" className="dialog-close-button" type="button" onClick={close}>×</button>
          </div>

          {state.status === 'error' && state.message !== undefined ? (
            <div className="form-error-summary" role="alert">{state.message}</div>
          ) : null}
          {state.status === 'success' ? (
            <div className="form-success-summary" role="status">Document updated successfully.</div>
          ) : null}

          <div className="form-field">
            <label htmlFor="edit-document-title">Title</label>
            <input
              id="edit-document-title"
              name="title"
              type="text"
              required
              maxLength={200}
              defaultValue={state.values?.title ?? doc.title}
              aria-invalid={state.fieldErrors?.title !== undefined}
            />
            {state.fieldErrors?.title !== undefined ? (
              <span className="form-field-error">{state.fieldErrors.title}</span>
            ) : null}
          </div>

          <div className="form-field">
            <label htmlFor="edit-document-type">Type</label>
            <select id="edit-document-type" name="type" defaultValue={state.values?.type ?? doc.type}>
              {DOCUMENT_TYPES.map((t) => (
                <option key={t.value} value={t.value}>{t.label}</option>
              ))}
            </select>
          </div>

          <div className="form-field">
            <label htmlFor="edit-document-status">Status</label>
            <select id="edit-document-status" name="status" defaultValue={state.values?.status ?? doc.status}>
              {DOCUMENT_STATUSES.map((s) => (
                <option key={s.value} value={s.value}>{s.label}</option>
              ))}
            </select>
          </div>

          <div className="form-field">
            <label htmlFor="edit-document-description">Description</label>
            <textarea
              id="edit-document-description"
              name="description"
              rows={3}
              maxLength={2000}
              defaultValue={state.values?.description ?? (doc.description ?? '')}
            />
          </div>

          <div className="form-field">
            <label htmlFor="edit-document-source">Source URL</label>
            <input
              id="edit-document-source"
              name="sourceUrl"
              type="url"
              maxLength={500}
              defaultValue={state.values?.sourceUrl ?? (doc.sourceUrl ?? '')}
            />
          </div>

          {programs.length > 0 ? (
            <div className="form-field">
              <label htmlFor="edit-document-program">Program</label>
              <select id="edit-document-program" name="programId" defaultValue={state.values?.programId ?? (doc.programId ?? '')}>
                <option value="">None</option>
                {programs.map((p) => (
                  <option key={p.id} value={p.id}>{p.name}</option>
                ))}
              </select>
            </div>
          ) : null}

          {projects.length > 0 ? (
            <div className="form-field">
              <label htmlFor="edit-document-project">Project</label>
              <select id="edit-document-project" name="projectId" defaultValue={state.values?.projectId ?? (doc.projectId ?? '')}>
                <option value="">None</option>
                {projects.map((p) => (
                  <option key={p.id} value={p.id}>{p.name}</option>
                ))}
              </select>
            </div>
          ) : null}

          <div className="organization-form-actions">
            <button className="secondary-button" type="button" onClick={close}>Cancel</button>
            <EditDocumentSubmitButton />
          </div>
        </form>
      </dialog>
    </>
  );
}

function EditDocumentSubmitButton() {
  const { pending } = useFormStatus();
  return (
    <button className="primary-button" type="submit" disabled={pending}>
      {pending ? 'Saving…' : 'Save changes'}
    </button>
  );
}
