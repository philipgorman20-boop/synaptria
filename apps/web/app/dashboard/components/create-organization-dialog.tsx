'use client';

import {
  useActionState,
  useEffect,
  useRef,
  useState,
  type ChangeEvent,
} from 'react';
import { useFormStatus } from 'react-dom';

import {
  createOrganizationAction,
  initialCreateOrganizationState,
} from '../../actions/organization/create-organization';

export function CreateOrganizationDialog() {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const [state, formAction] = useActionState(
    createOrganizationAction,
    initialCreateOrganizationState,
  );
  const [name, setName] = useState('');
  const [slug, setSlug] = useState('');
  const [slugWasEdited, setSlugWasEdited] = useState(false);

  useEffect(() => {
    if (state.status === 'error') {
      dialogRef.current?.showModal();
    }
  }, [state]);

  function openDialog() {
    dialogRef.current?.showModal();
  }

  function closeDialog() {
    dialogRef.current?.close();
  }

  function handleNameChange(event: ChangeEvent<HTMLInputElement>) {
    const nextName = event.target.value;
    setName(nextName);

    if (!slugWasEdited) {
      setSlug(toSlug(nextName));
    }
  }

  function handleSlugChange(event: ChangeEvent<HTMLInputElement>) {
    setSlugWasEdited(true);
    setSlug(toSlug(event.target.value));
  }

  return (
    <>
      <button
        className="create-organization-button"
        type="button"
        onClick={openDialog}
      >
        New organization
      </button>

      <dialog
        ref={dialogRef}
        className="organization-dialog"
        onCancel={closeDialog}
      >
        <form action={formAction} className="organization-form">
          <div className="organization-dialog-heading">
            <div>
              <p className="eyebrow">NEW WORKSPACE</p>
              <h2>Create an organization</h2>
              <p>
                Start a separate operating workspace with its own programs,
                finances, vendors, documents, and team.
              </p>
            </div>
            <button
              aria-label="Close dialog"
              className="dialog-close-button"
              type="button"
              onClick={closeDialog}
            >
              ×
            </button>
          </div>

          {state.status === 'error' && state.message !== undefined ? (
            <div className="form-error-summary" role="alert">
              {state.message}
            </div>
          ) : null}

          <div className="form-field">
            <label htmlFor="organization-name">Organization name</label>
            <input
              id="organization-name"
              name="name"
              type="text"
              autoComplete="organization"
              autoFocus
              required
              maxLength={120}
              value={name || state.values?.name || ''}
              aria-describedby={
                state.fieldErrors?.name === undefined
                  ? undefined
                  : 'organization-name-error'
              }
              aria-invalid={state.fieldErrors?.name !== undefined}
              onChange={handleNameChange}
              placeholder="Acme Therapeutics"
            />
            {state.fieldErrors?.name === undefined ? (
              <span className="form-help">The name shown throughout Synaptria.</span>
            ) : (
              <span className="form-field-error" id="organization-name-error">
                {state.fieldErrors.name}
              </span>
            )}
          </div>

          <div className="form-field">
            <label htmlFor="organization-slug">Workspace slug</label>
            <div className="slug-input-row">
              <span>synaptria.app/</span>
              <input
                id="organization-slug"
                name="slug"
                type="text"
                required
                maxLength={80}
                value={slug || state.values?.slug || ''}
                aria-describedby={
                  state.fieldErrors?.slug === undefined
                    ? undefined
                    : 'organization-slug-error'
                }
                aria-invalid={state.fieldErrors?.slug !== undefined}
                onChange={handleSlugChange}
                placeholder="acme-therapeutics"
              />
            </div>
            {state.fieldErrors?.slug === undefined ? (
              <span className="form-help">
                Lowercase letters, numbers, and hyphens only.
              </span>
            ) : (
              <span className="form-field-error" id="organization-slug-error">
                {state.fieldErrors.slug}
              </span>
            )}
          </div>

          <div className="organization-form-actions">
            <button
              className="secondary-button"
              type="button"
              onClick={closeDialog}
            >
              Cancel
            </button>
            <CreateOrganizationSubmitButton />
          </div>
        </form>
      </dialog>
    </>
  );
}

function CreateOrganizationSubmitButton() {
  const { pending } = useFormStatus();

  return (
    <button
      className="primary-button"
      type="submit"
      disabled={pending}
    >
      {pending ? 'Creating…' : 'Create organization'}
    </button>
  );
}

function toSlug(value: string): string {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .replace(/-{2,}/g, '-');
}
