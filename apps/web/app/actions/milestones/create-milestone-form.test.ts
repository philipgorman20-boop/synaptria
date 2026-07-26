import assert from 'node:assert/strict';
import test from 'node:test';

import { ApplicationError } from '@synaptria/application';
import { projectId } from '@synaptria/core';
import { AuthorizationDeniedError } from '@synaptria/core/errors';

import {
  mapCreateMilestoneActionError,
  readCreateMilestoneFormValues,
  toCreateMilestoneInput,
  validateCreateMilestoneFormValues,
} from './create-milestone-form';

const PROJECT_UUID = '550e8400-e29b-41d4-a716-446655440000';

const VALUES = {
  projectId: PROJECT_UUID,
  name: 'Phase 1 Gate',
  description: 'Initial review',
  status: 'PLANNED',
  priority: 'HIGH',
  plannedStartDate: '2026-08-01',
  plannedEndDate: '2026-08-31',
  actualStartDate: '',
  actualEndDate: '',
};

test('readCreateMilestoneFormValues trims submitted fields', () => {
  const formData = new FormData();
  formData.set('projectId', ` ${PROJECT_UUID} `);
  formData.set('name', '  Phase 1 Gate  ');
  formData.set('description', ' Initial review ');
  formData.set('status', ' PLANNED ');
  formData.set('priority', ' HIGH ');
  formData.set('plannedStartDate', ' 2026-08-01 ');
  formData.set('plannedEndDate', ' 2026-08-31 ');
  formData.set('actualStartDate', ' ');
  formData.set('actualEndDate', ' ');

  assert.deepEqual(readCreateMilestoneFormValues(formData), VALUES);
});

test('validateCreateMilestoneFormValues requires projectId and name', () => {
  const result = validateCreateMilestoneFormValues({
    ...VALUES,
    projectId: '   ',
    name: '   ',
  });

  assert.equal(result?.status, 'error');
  assert.equal(result?.fieldErrors?.projectId, 'Project is required.');
  assert.equal(result?.fieldErrors?.name, 'Milestone name is required.');
});

test('validateCreateMilestoneFormValues rejects malformed projectId values', () => {
  const result = validateCreateMilestoneFormValues({
    ...VALUES,
    projectId: 'project-1',
  });

  assert.equal(result?.status, 'error');
  assert.equal(result?.fieldErrors?.projectId, 'Select a valid project.');
});

test('validateCreateMilestoneFormValues rejects invalid status and priority values', () => {
  const result = validateCreateMilestoneFormValues({
    ...VALUES,
    status: 'NOT_STARTED',
    priority: 'URGENT',
  });

  assert.equal(result?.fieldErrors?.status, 'Select a valid status.');
  assert.equal(result?.fieldErrors?.priority, 'Select a valid priority.');
});

test('validateCreateMilestoneFormValues rejects invalid date values', () => {
  const result = validateCreateMilestoneFormValues({
    ...VALUES,
    plannedStartDate: 'not-a-date',
  });

  assert.equal(result?.fieldErrors?.plannedStartDate, 'Enter a valid date.');
});

test('validateCreateMilestoneFormValues accepts valid optional fields', () => {
  const result = validateCreateMilestoneFormValues(VALUES);

  assert.equal(result, undefined);
});

test('toCreateMilestoneInput maps validated fields and omits empty optional values', () => {
  assert.deepEqual(toCreateMilestoneInput(VALUES), {
    projectId: projectId(PROJECT_UUID),
    name: 'Phase 1 Gate',
    description: 'Initial review',
    status: 'PLANNED',
    priority: 'HIGH',
    plannedStartDate: new Date('2026-08-01'),
    plannedEndDate: new Date('2026-08-31'),
  });

  assert.deepEqual(
    toCreateMilestoneInput({
      projectId: PROJECT_UUID,
      name: 'Phase 1 Gate',
      description: '',
      status: '',
      priority: '',
      plannedStartDate: '',
      plannedEndDate: '',
      actualStartDate: '',
      actualEndDate: '',
    }),
    {
      projectId: projectId(PROJECT_UUID),
      name: 'Phase 1 Gate',
    },
  );
});

test('mapCreateMilestoneActionError maps application validation failures to field errors', () => {
  const result = mapCreateMilestoneActionError(
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

test('mapCreateMilestoneActionError maps authorization failures', () => {
  const result = mapCreateMilestoneActionError(
    new AuthorizationDeniedError(),
    VALUES,
  );

  assert.equal(
    result?.message,
    'You do not have permission to create milestones.',
  );
});

test('mapCreateMilestoneActionError maps inaccessible parent projects safely', () => {
  const result = mapCreateMilestoneActionError(
    new ApplicationError({
      code: 'NOT_FOUND',
      message: 'The requested project was not found.',
      details: { field: 'projectId', projectId: PROJECT_UUID },
    }),
    VALUES,
  );

  assert.equal(result?.fieldErrors?.projectId, 'The selected project is not available.');
});

test('mapCreateMilestoneActionError returns undefined for unexpected errors', () => {
  const result = mapCreateMilestoneActionError(new Error('database unavailable'), VALUES);

  assert.equal(result, undefined);
});
