import assert from 'node:assert/strict';
import test from 'node:test';

import { ApplicationError } from '@synaptria/application';
import { milestoneId } from '@synaptria/core';
import { AuthorizationDeniedError } from '@synaptria/core/errors';

import {
  mapCreateTaskActionError,
  readCreateTaskFormValues,
  toCreateTaskInput,
  validateCreateTaskFormValues,
} from './create-task-form';

const MILESTONE_UUID = '550e8400-e29b-41d4-a716-446655440000';

const VALUES = {
  milestoneId: MILESTONE_UUID,
  name: 'Prepare assay protocol',
  description: 'Initial draft',
  status: 'TODO',
  priority: 'HIGH',
  plannedStartDate: '2026-08-01',
  plannedEndDate: '2026-08-31',
  actualStartDate: '',
  actualEndDate: '',
};

test('readCreateTaskFormValues trims submitted fields', () => {
  const formData = new FormData();
  formData.set('milestoneId', ` ${MILESTONE_UUID} `);
  formData.set('name', '  Prepare assay protocol  ');
  formData.set('description', ' Initial draft ');
  formData.set('status', ' TODO ');
  formData.set('priority', ' HIGH ');
  formData.set('plannedStartDate', ' 2026-08-01 ');
  formData.set('plannedEndDate', ' 2026-08-31 ');
  formData.set('actualStartDate', ' ');
  formData.set('actualEndDate', ' ');

  assert.deepEqual(readCreateTaskFormValues(formData), VALUES);
});

test('validateCreateTaskFormValues requires milestoneId and name', () => {
  const result = validateCreateTaskFormValues({
    ...VALUES,
    milestoneId: '   ',
    name: '   ',
  });

  assert.equal(result?.status, 'error');
  assert.equal(result?.fieldErrors?.milestoneId, 'Milestone is required.');
  assert.equal(result?.fieldErrors?.name, 'Task name is required.');
});

test('validateCreateTaskFormValues rejects malformed milestoneId values', () => {
  const result = validateCreateTaskFormValues({
    ...VALUES,
    milestoneId: 'milestone-1',
  });

  assert.equal(result?.status, 'error');
  assert.equal(result?.fieldErrors?.milestoneId, 'Select a valid milestone.');
});

test('validateCreateTaskFormValues rejects invalid status and priority values', () => {
  const result = validateCreateTaskFormValues({
    ...VALUES,
    status: 'NOT_STARTED',
    priority: 'URGENT',
  });

  assert.equal(result?.fieldErrors?.status, 'Select a valid status.');
  assert.equal(result?.fieldErrors?.priority, 'Select a valid priority.');
});

test('validateCreateTaskFormValues rejects invalid date values', () => {
  const result = validateCreateTaskFormValues({
    ...VALUES,
    plannedStartDate: 'not-a-date',
  });

  assert.equal(result?.fieldErrors?.plannedStartDate, 'Enter a valid date.');
});

test('validateCreateTaskFormValues accepts valid optional fields', () => {
  const result = validateCreateTaskFormValues(VALUES);

  assert.equal(result, undefined);
});

test('toCreateTaskInput maps validated fields and omits empty optional values', () => {
  assert.deepEqual(toCreateTaskInput(VALUES), {
    milestoneId: milestoneId(MILESTONE_UUID),
    name: 'Prepare assay protocol',
    description: 'Initial draft',
    status: 'TODO',
    priority: 'HIGH',
    plannedStartDate: new Date('2026-08-01'),
    plannedEndDate: new Date('2026-08-31'),
  });

  assert.deepEqual(
    toCreateTaskInput({
      milestoneId: MILESTONE_UUID,
      name: 'Prepare assay protocol',
      description: '',
      status: '',
      priority: '',
      plannedStartDate: '',
      plannedEndDate: '',
      actualStartDate: '',
      actualEndDate: '',
    }),
    {
      milestoneId: milestoneId(MILESTONE_UUID),
      name: 'Prepare assay protocol',
    },
  );
});

test('mapCreateTaskActionError maps application validation failures to field errors', () => {
  const result = mapCreateTaskActionError(
    new ApplicationError({
      code: 'VALIDATION_FAILED',
      message: 'plannedStartDate must be on or before plannedEndDate.',
      details: { field: 'plannedStartDate' },
    }),
    VALUES,
  );

  assert.equal(result?.status, 'error');
  assert.equal(
    result?.fieldErrors?.plannedStartDate,
    'plannedStartDate must be on or before plannedEndDate.',
  );
});

test('mapCreateTaskActionError maps authorization failures', () => {
  const result = mapCreateTaskActionError(
    new AuthorizationDeniedError(),
    VALUES,
  );

  assert.equal(result?.message, 'You do not have permission to create tasks.');
});

test('mapCreateTaskActionError maps inaccessible parent milestones safely', () => {
  const result = mapCreateTaskActionError(
    new ApplicationError({
      code: 'NOT_FOUND',
      message: 'The requested milestone was not found.',
      details: { field: 'milestoneId', milestoneId: MILESTONE_UUID },
    }),
    VALUES,
  );

  assert.equal(
    result?.fieldErrors?.milestoneId,
    'The selected milestone is not available.',
  );
});

test('mapCreateTaskActionError returns undefined for unexpected errors', () => {
  const result = mapCreateTaskActionError(new Error('database unavailable'), VALUES);

  assert.equal(result, undefined);
});
