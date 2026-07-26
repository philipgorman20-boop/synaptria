'use client';

import type { ProjectId } from '@synaptria/core';
import { projectId as toProjectId } from '@synaptria/core';
import {
  useActionState,
  useEffect,
  useState,
  type ChangeEvent,
} from 'react';
import { useFormStatus } from 'react-dom';

import {
  createMilestoneAction,
  initialCreateMilestoneState,
  type CreateMilestoneActionState,
} from '../../../../../actions/milestones/create-milestone';
import { formatMilestoneDateInputValue } from '../../../../../../lib/milestones-format';

export const CREATE_MILESTONE_FORM_HEADING = 'Create a milestone';

export interface CreateMilestoneFormProps {
  readonly projectId: ProjectId;
}

export function CreateMilestoneForm({ projectId }: CreateMilestoneFormProps) {
  const [state, formAction] = useActionState(
    createMilestoneAction,
    initialCreateMilestoneState,
  );
  const [formValues, setFormValues] = useState(createInitialFormValues(projectId));

  useEffect(() => {
    if (state.status !== 'error' || state.values === undefined) {
      return;
    }

    setFormValues({
      projectId: toProjectId(state.values.projectId),
      name: state.values.name,
      description: state.values.description,
      status: state.values.status,
      priority: state.values.priority,
      plannedStartDate: formatMilestoneDateInputValue(state.values.plannedStartDate),
      plannedEndDate: formatMilestoneDateInputValue(state.values.plannedEndDate),
      actualStartDate: formatMilestoneDateInputValue(state.values.actualStartDate),
      actualEndDate: formatMilestoneDateInputValue(state.values.actualEndDate),
    });
  }, [state]);

  return (
    <form action={formAction} className="organization-form milestone-create-form">
      <input name="projectId" type="hidden" value={formValues.projectId} readOnly />

      {state.status === 'error' && state.message !== undefined ? (
        <div className="form-error-summary" role="alert">
          {state.message}
        </div>
      ) : null}

      <div className="form-field">
        <label htmlFor="milestone-name">Milestone name</label>
        <input
          id="milestone-name"
          name="name"
          type="text"
          autoComplete="off"
          required
          maxLength={120}
          value={formValues.name}
          aria-describedby={
            state.fieldErrors?.name === undefined
              ? 'milestone-name-help'
              : 'milestone-name-error'
          }
          aria-invalid={state.fieldErrors?.name !== undefined}
          onChange={(event: ChangeEvent<HTMLInputElement>) =>
            setFormValues((current) => ({ ...current, name: event.target.value }))
          }
          placeholder="Phase 1 Gate"
        />
        {state.fieldErrors?.name === undefined ? (
          <span className="form-help" id="milestone-name-help">
            The name shown throughout the project.
          </span>
        ) : (
          <span className="form-field-error" id="milestone-name-error">
            {state.fieldErrors.name}
          </span>
        )}
      </div>

      <div className="form-field">
        <label htmlFor="milestone-description">Description</label>
        <textarea
          id="milestone-description"
          name="description"
          rows={4}
          maxLength={2000}
          value={formValues.description}
          aria-describedby={
            state.fieldErrors?.description === undefined
              ? 'milestone-description-help'
              : 'milestone-description-error'
          }
          aria-invalid={state.fieldErrors?.description !== undefined}
          onChange={(event: ChangeEvent<HTMLTextAreaElement>) =>
            setFormValues((current) => ({
              ...current,
              description: event.target.value,
            }))
          }
          placeholder="Brief summary of this milestone."
        />
        {state.fieldErrors?.description === undefined ? (
          <span className="form-help" id="milestone-description-help">
            Optional context for stakeholders.
          </span>
        ) : (
          <span className="form-field-error" id="milestone-description-error">
            {state.fieldErrors.description}
          </span>
        )}
      </div>

      <div className="form-field">
        <label htmlFor="milestone-status">Status</label>
        <select
          id="milestone-status"
          name="status"
          value={formValues.status}
          aria-describedby={
            state.fieldErrors?.status === undefined
              ? 'milestone-status-help'
              : 'milestone-status-error'
          }
          aria-invalid={state.fieldErrors?.status !== undefined}
          onChange={(event: ChangeEvent<HTMLSelectElement>) =>
            setFormValues((current) => ({ ...current, status: event.target.value }))
          }
        >
          <option value="">Default (Planned)</option>
          <option value="PLANNED">Planned</option>
          <option value="IN_PROGRESS">In progress</option>
          <option value="BLOCKED">Blocked</option>
          <option value="COMPLETED">Completed</option>
          <option value="CANCELLED">Cancelled</option>
        </select>
        {state.fieldErrors?.status === undefined ? (
          <span className="form-help" id="milestone-status-help">
            Optional. Defaults to planned when omitted.
          </span>
        ) : (
          <span className="form-field-error" id="milestone-status-error">
            {state.fieldErrors.status}
          </span>
        )}
      </div>

      <div className="form-field">
        <label htmlFor="milestone-priority">Priority</label>
        <select
          id="milestone-priority"
          name="priority"
          value={formValues.priority}
          aria-describedby={
            state.fieldErrors?.priority === undefined
              ? 'milestone-priority-help'
              : 'milestone-priority-error'
          }
          aria-invalid={state.fieldErrors?.priority !== undefined}
          onChange={(event: ChangeEvent<HTMLSelectElement>) =>
            setFormValues((current) => ({ ...current, priority: event.target.value }))
          }
        >
          <option value="">Default (Medium)</option>
          <option value="LOW">Low</option>
          <option value="MEDIUM">Medium</option>
          <option value="HIGH">High</option>
          <option value="CRITICAL">Critical</option>
        </select>
        {state.fieldErrors?.priority === undefined ? (
          <span className="form-help" id="milestone-priority-help">
            Optional. Defaults to medium when omitted.
          </span>
        ) : (
          <span className="form-field-error" id="milestone-priority-error">
            {state.fieldErrors.priority}
          </span>
        )}
      </div>

      <div className="form-field">
        <label htmlFor="milestone-planned-start-date">Planned start</label>
        <input
          id="milestone-planned-start-date"
          name="plannedStartDate"
          type="date"
          value={formValues.plannedStartDate}
          aria-describedby={
            state.fieldErrors?.plannedStartDate === undefined
              ? undefined
              : 'milestone-planned-start-date-error'
          }
          aria-invalid={state.fieldErrors?.plannedStartDate !== undefined}
          onChange={(event: ChangeEvent<HTMLInputElement>) =>
            setFormValues((current) => ({
              ...current,
              plannedStartDate: event.target.value,
            }))
          }
        />
        {state.fieldErrors?.plannedStartDate !== undefined ? (
          <span className="form-field-error" id="milestone-planned-start-date-error">
            {state.fieldErrors.plannedStartDate}
          </span>
        ) : null}
      </div>

      <div className="form-field">
        <label htmlFor="milestone-planned-end-date">Planned end</label>
        <input
          id="milestone-planned-end-date"
          name="plannedEndDate"
          type="date"
          value={formValues.plannedEndDate}
          aria-describedby={
            state.fieldErrors?.plannedEndDate === undefined
              ? undefined
              : 'milestone-planned-end-date-error'
          }
          aria-invalid={state.fieldErrors?.plannedEndDate !== undefined}
          onChange={(event: ChangeEvent<HTMLInputElement>) =>
            setFormValues((current) => ({
              ...current,
              plannedEndDate: event.target.value,
            }))
          }
        />
        {state.fieldErrors?.plannedEndDate !== undefined ? (
          <span className="form-field-error" id="milestone-planned-end-date-error">
            {state.fieldErrors.plannedEndDate}
          </span>
        ) : null}
      </div>

      <div className="form-field">
        <label htmlFor="milestone-actual-start-date">Actual start</label>
        <input
          id="milestone-actual-start-date"
          name="actualStartDate"
          type="date"
          value={formValues.actualStartDate}
          aria-describedby={
            state.fieldErrors?.actualStartDate === undefined
              ? undefined
              : 'milestone-actual-start-date-error'
          }
          aria-invalid={state.fieldErrors?.actualStartDate !== undefined}
          onChange={(event: ChangeEvent<HTMLInputElement>) =>
            setFormValues((current) => ({
              ...current,
              actualStartDate: event.target.value,
            }))
          }
        />
        {state.fieldErrors?.actualStartDate !== undefined ? (
          <span className="form-field-error" id="milestone-actual-start-date-error">
            {state.fieldErrors.actualStartDate}
          </span>
        ) : null}
      </div>

      <div className="form-field">
        <label htmlFor="milestone-actual-end-date">Actual end</label>
        <input
          id="milestone-actual-end-date"
          name="actualEndDate"
          type="date"
          value={formValues.actualEndDate}
          aria-describedby={
            state.fieldErrors?.actualEndDate === undefined
              ? undefined
              : 'milestone-actual-end-date-error'
          }
          aria-invalid={state.fieldErrors?.actualEndDate !== undefined}
          onChange={(event: ChangeEvent<HTMLInputElement>) =>
            setFormValues((current) => ({
              ...current,
              actualEndDate: event.target.value,
            }))
          }
        />
        {state.fieldErrors?.actualEndDate !== undefined ? (
          <span className="form-field-error" id="milestone-actual-end-date-error">
            {state.fieldErrors.actualEndDate}
          </span>
        ) : null}
      </div>

      <div className="organization-form-actions">
        <CreateMilestoneSubmitButton />
      </div>
    </form>
  );
}

function CreateMilestoneSubmitButton() {
  const { pending } = useFormStatus();

  return (
    <button className="primary-button" type="submit" disabled={pending}>
      {pending ? 'Creating…' : 'Create milestone'}
    </button>
  );
}

function createInitialFormValues(projectIdValue: ProjectId) {
  return {
    projectId: projectIdValue,
    name: '',
    description: '',
    status: '',
    priority: '',
    plannedStartDate: '',
    plannedEndDate: '',
    actualStartDate: '',
    actualEndDate: '',
  };
}

export function resolveCreateMilestoneFormValues(
  state: CreateMilestoneActionState,
  projectIdValue: ProjectId,
) {
  if (state.status === 'error' && state.values !== undefined) {
    return {
      projectId: toProjectId(state.values.projectId),
      name: state.values.name,
      description: state.values.description,
      status: state.values.status,
      priority: state.values.priority,
      plannedStartDate: formatMilestoneDateInputValue(state.values.plannedStartDate),
      plannedEndDate: formatMilestoneDateInputValue(state.values.plannedEndDate),
      actualStartDate: formatMilestoneDateInputValue(state.values.actualStartDate),
      actualEndDate: formatMilestoneDateInputValue(state.values.actualEndDate),
    };
  }

  return createInitialFormValues(projectIdValue);
}
