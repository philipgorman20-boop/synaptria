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
  createProgramAction,
  initialCreateProgramState,
} from '../../actions/programs/create-program';
import { suggestProgramCodeFromName } from '../../actions/programs/create-program-form';

export interface CreateProgramDialogProps {
  readonly triggerLabel?: string;
  readonly triggerClassName?: string;
}

export function CreateProgramDialog({
  triggerLabel = 'Create program',
  triggerClassName = 'primary-button',
}: CreateProgramDialogProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const [state, formAction] = useActionState(
    createProgramAction,
    initialCreateProgramState,
  );
  const [name, setName] = useState('');
  const [code, setCode] = useState('');
  const [codeWasEdited, setCodeWasEdited] = useState(false);
  const [description, setDescription] = useState('');

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

    if (!codeWasEdited) {
      setCode(suggestProgramCodeFromName(nextName));
    }
  }

  function handleCodeChange(event: ChangeEvent<HTMLInputElement>) {
    setCodeWasEdited(true);
    setCode(suggestProgramCodeFromName(event.target.value));
  }

  function handleDescriptionChange(event: ChangeEvent<HTMLTextAreaElement>) {
    setDescription(event.target.value);
  }

  return (
    <>
      <button
        className={triggerClassName}
        type="button"
        onClick={openDialog}
      >
        {triggerLabel}
      </button>

      <dialog
        ref={dialogRef}
        className="organization-dialog"
        onCancel={closeDialog}
      >
        <form action={formAction} className="organization-form">
          <div className="organization-dialog-heading">
            <div>
              <p className="eyebrow">NEW PROGRAM</p>
              <h2>Create a program</h2>
              <p>
                Add a strategic initiative to organize related projects,
                milestones, and portfolio reporting.
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
            <label htmlFor="program-name">Program name</label>
            <input
              id="program-name"
              name="name"
              type="text"
              autoComplete="off"
              autoFocus
              required
              maxLength={120}
              value={name || state.values?.name || ''}
              aria-describedby={
                state.fieldErrors?.name === undefined
                  ? 'program-name-help'
                  : 'program-name-error'
              }
              aria-invalid={state.fieldErrors?.name !== undefined}
              onChange={handleNameChange}
              placeholder="Oncology Portfolio"
            />
            {state.fieldErrors?.name === undefined ? (
              <span className="form-help" id="program-name-help">
                The name shown throughout the portfolio.
              </span>
            ) : (
              <span className="form-field-error" id="program-name-error">
                {state.fieldErrors.name}
              </span>
            )}
          </div>

          <div className="form-field">
            <label htmlFor="program-code">Program code</label>
            <input
              id="program-code"
              name="code"
              type="text"
              autoComplete="off"
              maxLength={80}
              value={code || state.values?.code || ''}
              aria-describedby={
                state.fieldErrors?.code === undefined
                  ? 'program-code-help'
                  : 'program-code-error'
              }
              aria-invalid={state.fieldErrors?.code !== undefined}
              onChange={handleCodeChange}
              placeholder="ONCO-001"
            />
            {state.fieldErrors?.code === undefined ? (
              <span className="form-help" id="program-code-help">
                Optional. Letters, numbers, and single hyphens only.
              </span>
            ) : (
              <span className="form-field-error" id="program-code-error">
                {state.fieldErrors.code}
              </span>
            )}
          </div>

          <div className="form-field">
            <label htmlFor="program-description">Description</label>
            <textarea
              id="program-description"
              name="description"
              rows={4}
              maxLength={2000}
              value={description || state.values?.description || ''}
              aria-describedby={
                state.fieldErrors?.description === undefined
                  ? 'program-description-help'
                  : 'program-description-error'
              }
              aria-invalid={state.fieldErrors?.description !== undefined}
              onChange={handleDescriptionChange}
              placeholder="Brief summary of the program scope and objective."
            />
            {state.fieldErrors?.description === undefined ? (
              <span className="form-help" id="program-description-help">
                Optional context for portfolio stakeholders.
              </span>
            ) : (
              <span className="form-field-error" id="program-description-error">
                {state.fieldErrors.description}
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
            <CreateProgramSubmitButton />
          </div>
        </form>
      </dialog>
    </>
  );
}

function CreateProgramSubmitButton() {
  const { pending } = useFormStatus();

  return (
    <button className="primary-button" type="submit" disabled={pending}>
      {pending ? 'Creating…' : 'Create program'}
    </button>
  );
}
