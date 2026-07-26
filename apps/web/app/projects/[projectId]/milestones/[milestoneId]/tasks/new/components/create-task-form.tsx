'use client';

import type { MilestoneId } from '@synaptria/core';
import {
  useActionState,
  useEffect,
  useState,
  type ChangeEvent,
} from 'react';
import { useFormStatus } from 'react-dom';

import { createTaskAction } from '../../../../../../../actions/tasks/create-task';
import {
  initialCreateTaskState,
  type CreateTaskActionState,
} from '../../../../../../../actions/tasks/create-task-form';
import { formatTaskDateInputValue } from '../../../../../../../../lib/tasks-format';

export const CREATE_TASK_FORM_HEADING = 'Create a task';

export interface CreateTaskFormProps {
  readonly milestoneId: MilestoneId;
}

export function CreateTaskForm({ milestoneId }: CreateTaskFormProps) {
  const createTaskForMilestone = createTaskAction.bind(null, milestoneId);
  const [state, formAction] = useActionState(
    createTaskForMilestone,
    initialCreateTaskState,
  );
  const [formValues, setFormValues] = useState(createInitialFormValues());

  useEffect(() => {
    if (state.status !== 'error' || state.values === undefined) {
      return;
    }

    setFormValues({
      name: state.values.name,
      description: state.values.description,
      status: state.values.status,
      priority: state.values.priority,
      plannedStartDate: formatTaskDateInputValue(state.values.plannedStartDate),
      plannedEndDate: formatTaskDateInputValue(state.values.plannedEndDate),
      actualStartDate: formatTaskDateInputValue(state.values.actualStartDate),
      actualEndDate: formatTaskDateInputValue(state.values.actualEndDate),
    });
  }, [state]);

  return (
    <form action={formAction} className="organization-form task-create-form">
      {state.status === 'error' && state.message !== undefined ? (
        <div className="form-error-summary" role="alert">
          {state.message}
        </div>
      ) : null}

      <div className="form-field">
        <label htmlFor="task-name">Task name</label>
        <input
          id="task-name"
          name="name"
          type="text"
          autoComplete="off"
          required
          maxLength={120}
          value={formValues.name}
          aria-describedby={
            state.fieldErrors?.name === undefined
              ? 'task-name-help'
              : 'task-name-error'
          }
          aria-invalid={state.fieldErrors?.name !== undefined}
          onChange={(event: ChangeEvent<HTMLInputElement>) =>
            setFormValues((current) => ({ ...current, name: event.target.value }))
          }
          placeholder="Prepare assay protocol"
        />
        {state.fieldErrors?.name === undefined ? (
          <span className="form-help" id="task-name-help">
            The name shown throughout the milestone.
          </span>
        ) : (
          <span className="form-field-error" id="task-name-error">
            {state.fieldErrors.name}
          </span>
        )}
      </div>

      <div className="form-field">
        <label htmlFor="task-description">Description</label>
        <textarea
          id="task-description"
          name="description"
          rows={4}
          maxLength={2000}
          value={formValues.description}
          aria-describedby={
            state.fieldErrors?.description === undefined
              ? 'task-description-help'
              : 'task-description-error'
          }
          aria-invalid={state.fieldErrors?.description !== undefined}
          onChange={(event: ChangeEvent<HTMLTextAreaElement>) =>
            setFormValues((current) => ({
              ...current,
              description: event.target.value,
            }))
          }
          placeholder="Brief summary of this task."
        />
        {state.fieldErrors?.description === undefined ? (
          <span className="form-help" id="task-description-help">
            Optional context for collaborators.
          </span>
        ) : (
          <span className="form-field-error" id="task-description-error">
            {state.fieldErrors.description}
          </span>
        )}
      </div>

      <div className="form-field">
        <label htmlFor="task-status">Status</label>
        <select
          id="task-status"
          name="status"
          value={formValues.status}
          aria-describedby={
            state.fieldErrors?.status === undefined
              ? 'task-status-help'
              : 'task-status-error'
          }
          aria-invalid={state.fieldErrors?.status !== undefined}
          onChange={(event: ChangeEvent<HTMLSelectElement>) =>
            setFormValues((current) => ({ ...current, status: event.target.value }))
          }
        >
          <option value="">Default (To do)</option>
          <option value="TODO">To do</option>
          <option value="IN_PROGRESS">In progress</option>
          <option value="BLOCKED">Blocked</option>
          <option value="COMPLETED">Completed</option>
          <option value="CANCELLED">Cancelled</option>
        </select>
        {state.fieldErrors?.status === undefined ? (
          <span className="form-help" id="task-status-help">
            Optional. Defaults to to do when omitted.
          </span>
        ) : (
          <span className="form-field-error" id="task-status-error">
            {state.fieldErrors.status}
          </span>
        )}
      </div>

      <div className="form-field">
        <label htmlFor="task-priority">Priority</label>
        <select
          id="task-priority"
          name="priority"
          value={formValues.priority}
          aria-describedby={
            state.fieldErrors?.priority === undefined
              ? 'task-priority-help'
              : 'task-priority-error'
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
          <span className="form-help" id="task-priority-help">
            Optional. Defaults to medium when omitted.
          </span>
        ) : (
          <span className="form-field-error" id="task-priority-error">
            {state.fieldErrors.priority}
          </span>
        )}
      </div>

      <div className="form-field">
        <label htmlFor="task-planned-start-date">Planned start</label>
        <input
          id="task-planned-start-date"
          name="plannedStartDate"
          type="date"
          value={formValues.plannedStartDate}
          aria-describedby={
            state.fieldErrors?.plannedStartDate === undefined
              ? undefined
              : 'task-planned-start-date-error'
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
          <span className="form-field-error" id="task-planned-start-date-error">
            {state.fieldErrors.plannedStartDate}
          </span>
        ) : null}
      </div>

      <div className="form-field">
        <label htmlFor="task-planned-end-date">Planned end</label>
        <input
          id="task-planned-end-date"
          name="plannedEndDate"
          type="date"
          value={formValues.plannedEndDate}
          aria-describedby={
            state.fieldErrors?.plannedEndDate === undefined
              ? undefined
              : 'task-planned-end-date-error'
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
          <span className="form-field-error" id="task-planned-end-date-error">
            {state.fieldErrors.plannedEndDate}
          </span>
        ) : null}
      </div>

      <div className="form-field">
        <label htmlFor="task-actual-start-date">Actual start</label>
        <input
          id="task-actual-start-date"
          name="actualStartDate"
          type="date"
          value={formValues.actualStartDate}
          aria-describedby={
            state.fieldErrors?.actualStartDate === undefined
              ? undefined
              : 'task-actual-start-date-error'
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
          <span className="form-field-error" id="task-actual-start-date-error">
            {state.fieldErrors.actualStartDate}
          </span>
        ) : null}
      </div>

      <div className="form-field">
        <label htmlFor="task-actual-end-date">Actual end</label>
        <input
          id="task-actual-end-date"
          name="actualEndDate"
          type="date"
          value={formValues.actualEndDate}
          aria-describedby={
            state.fieldErrors?.actualEndDate === undefined
              ? undefined
              : 'task-actual-end-date-error'
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
          <span className="form-field-error" id="task-actual-end-date-error">
            {state.fieldErrors.actualEndDate}
          </span>
        ) : null}
      </div>

      <div className="organization-form-actions">
        <CreateTaskSubmitButton />
      </div>
    </form>
  );
}

function CreateTaskSubmitButton() {
  const { pending } = useFormStatus();

  return (
    <button className="primary-button" type="submit" disabled={pending}>
      {pending ? 'Creating…' : 'Create task'}
    </button>
  );
}

function createInitialFormValues() {
  return {
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

export function resolveCreateTaskFormValues(
  state: CreateTaskActionState,
) {
  if (state.status === 'error' && state.values !== undefined) {
    return {
      name: state.values.name,
      description: state.values.description,
      status: state.values.status,
      priority: state.values.priority,
      plannedStartDate: formatTaskDateInputValue(state.values.plannedStartDate),
      plannedEndDate: formatTaskDateInputValue(state.values.plannedEndDate),
      actualStartDate: formatTaskDateInputValue(state.values.actualStartDate),
      actualEndDate: formatTaskDateInputValue(state.values.actualEndDate),
    };
  }

  return createInitialFormValues();
}
