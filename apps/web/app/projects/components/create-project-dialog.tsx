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
  createProjectAction,
  initialCreateProjectState,
} from '../../actions/projects/create-project';
import { suggestProjectCodeFromName } from '../../actions/projects/create-project-form';
import {
  formatProjectProgramOptionLabel,
  type ProjectProgramOption,
} from '../projects-format';

export interface CreateProjectDialogProps {
  readonly programOptions: readonly ProjectProgramOption[];
  readonly triggerLabel?: string;
  readonly triggerClassName?: string;
}

export function CreateProjectDialog({
  programOptions,
  triggerLabel = 'Create project',
  triggerClassName = 'primary-button',
}: CreateProjectDialogProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const [state, formAction] = useActionState(
    createProjectAction,
    initialCreateProjectState,
  );
  const [name, setName] = useState('');
  const [code, setCode] = useState('');
  const [codeWasEdited, setCodeWasEdited] = useState(false);
  const [description, setDescription] = useState('');
  const [selectedProgramId, setSelectedProgramId] = useState('');

  useEffect(() => {
    if (state.status !== 'error') {
      return;
    }

    if (state.values !== undefined) {
      setName(state.values.name);
      setCode(state.values.code);
      setCodeWasEdited(true);
      setDescription(state.values.description);
      setSelectedProgramId(state.values.programId);
    }

    dialogRef.current?.showModal();
  }, [state]);

  function resetForm() {
    setName('');
    setCode('');
    setCodeWasEdited(false);
    setDescription('');
    setSelectedProgramId('');
  }

  function openDialog() {
    if (state.status !== 'error') {
      resetForm();
    }

    dialogRef.current?.showModal();
  }

  function closeDialog() {
    dialogRef.current?.close();
  }

  function handleNameChange(event: ChangeEvent<HTMLInputElement>) {
    const nextName = event.target.value;
    setName(nextName);

    if (!codeWasEdited) {
      setCode(suggestProjectCodeFromName(nextName));
    }
  }

  function handleCodeChange(event: ChangeEvent<HTMLInputElement>) {
    setCodeWasEdited(true);
    setCode(event.target.value);
  }

  function handleDescriptionChange(event: ChangeEvent<HTMLTextAreaElement>) {
    setDescription(event.target.value);
  }

  function handleProgramChange(event: ChangeEvent<HTMLSelectElement>) {
    setSelectedProgramId(event.target.value);
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
              <p className="eyebrow">NEW PROJECT</p>
              <h2>Create a project</h2>
              <p>
                Add an execution workstream to track milestones, deliverables,
                and operational progress.
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
            <label htmlFor="project-name">Project name</label>
            <input
              id="project-name"
              name="name"
              type="text"
              autoComplete="off"
              autoFocus
              required
              maxLength={120}
              value={name}
              aria-describedby={
                state.fieldErrors?.name === undefined
                  ? 'project-name-help'
                  : 'project-name-error'
              }
              aria-invalid={state.fieldErrors?.name !== undefined}
              onChange={handleNameChange}
              placeholder="Lead Candidate Study"
            />
            {state.fieldErrors?.name === undefined ? (
              <span className="form-help" id="project-name-help">
                The name shown throughout the portfolio.
              </span>
            ) : (
              <span className="form-field-error" id="project-name-error">
                {state.fieldErrors.name}
              </span>
            )}
          </div>

          <div className="form-field">
            <label htmlFor="project-code">Project code</label>
            <input
              id="project-code"
              name="code"
              type="text"
              autoComplete="off"
              maxLength={80}
              value={code}
              aria-describedby={
                state.fieldErrors?.code === undefined
                  ? 'project-code-help'
                  : 'project-code-error'
              }
              aria-invalid={state.fieldErrors?.code !== undefined}
              onChange={handleCodeChange}
              placeholder="LC-001"
            />
            {state.fieldErrors?.code === undefined ? (
              <span className="form-help" id="project-code-help">
                Optional. Letters, numbers, and single hyphens only.
              </span>
            ) : (
              <span className="form-field-error" id="project-code-error">
                {state.fieldErrors.code}
              </span>
            )}
          </div>

          <div className="form-field">
            <label htmlFor="project-program">Program</label>
            <select
              id="project-program"
              name="programId"
              value={selectedProgramId}
              aria-describedby={
                state.fieldErrors?.programId === undefined
                  ? 'project-program-help'
                  : 'project-program-error'
              }
              aria-invalid={state.fieldErrors?.programId !== undefined}
              onChange={handleProgramChange}
            >
              <option value="">No program</option>
              {programOptions.map((option) => (
                <option key={option.id} value={option.id}>
                  {formatProjectProgramOptionLabel(option)}
                </option>
              ))}
            </select>
            {state.fieldErrors?.programId === undefined ? (
              <span className="form-help" id="project-program-help">
                Optional. Link this project to a strategic program.
              </span>
            ) : (
              <span className="form-field-error" id="project-program-error">
                {state.fieldErrors.programId}
              </span>
            )}
          </div>

          <div className="form-field">
            <label htmlFor="project-description">Description</label>
            <textarea
              id="project-description"
              name="description"
              rows={4}
              maxLength={2000}
              value={description}
              aria-describedby={
                state.fieldErrors?.description === undefined
                  ? 'project-description-help'
                  : 'project-description-error'
              }
              aria-invalid={state.fieldErrors?.description !== undefined}
              onChange={handleDescriptionChange}
              placeholder="Brief summary of the project scope and objective."
            />
            {state.fieldErrors?.description === undefined ? (
              <span className="form-help" id="project-description-help">
                Optional context for stakeholders.
              </span>
            ) : (
              <span className="form-field-error" id="project-description-error">
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
            <CreateProjectSubmitButton />
          </div>
        </form>
      </dialog>
    </>
  );
}

function CreateProjectSubmitButton() {
  const { pending } = useFormStatus();

  return (
    <button className="primary-button" type="submit" disabled={pending}>
      {pending ? 'Creating…' : 'Create project'}
    </button>
  );
}
