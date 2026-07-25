import assert from 'node:assert/strict';
import test from 'node:test';

import { ApplicationError } from '@synaptria/application';
import { CoreError } from '@synaptria/core/errors';
import { AuthorizationDeniedError } from '@synaptria/core/errors';

import {
  mapCreateProgramActionError,
  readCreateProgramFormValues,
  validateCreateProgramFormValues,
} from './create-program-form';

const VALUES = {
  name: 'Oncology Portfolio',
  code: 'ONCO-001',
  description: 'Lead asset program',
};

test('readCreateProgramFormValues trims submitted fields', () => {
  const formData = new FormData();
  formData.set('name', '  Oncology Portfolio  ');
  formData.set('code', ' ONCO-001 ');
  formData.set('description', ' Lead asset program ');

  assert.deepEqual(readCreateProgramFormValues(formData), VALUES);
});

test('validateCreateProgramFormValues requires a program name', () => {
  const result = validateCreateProgramFormValues({
    ...VALUES,
    name: '   ',
  });

  assert.equal(result?.status, 'error');
  assert.equal(result?.fieldErrors?.name, 'Program name is required.');
});

test('validateCreateProgramFormValues rejects invalid code formats', () => {
  const result = validateCreateProgramFormValues({
    ...VALUES,
    code: 'bad code!',
  });

  assert.equal(result?.status, 'error');
  assert.equal(
    result?.fieldErrors?.code,
    'Use letters, numbers, and single hyphens only.',
  );
});

test('mapCreateProgramActionError maps application validation failures to field errors', () => {
  const result = mapCreateProgramActionError(
    new ApplicationError({
      code: 'VALIDATION_FAILED',
      message: 'code must contain uppercase letters, numbers, and single hyphens only.',
      details: { field: 'code' },
    }),
    VALUES,
  );

  assert.equal(result?.status, 'error');
  assert.equal(
    result?.fieldErrors?.code,
    'code must contain uppercase letters, numbers, and single hyphens only.',
  );
  assert.deepEqual(result?.values, VALUES);
});

test('mapCreateProgramActionError maps authorization failures', () => {
  const result = mapCreateProgramActionError(
    new AuthorizationDeniedError(),
    VALUES,
  );

  assert.equal(result?.message, 'You do not have permission to create programs.');
});

test('mapCreateProgramActionError maps persistence conflicts', () => {
  const result = mapCreateProgramActionError(
    new CoreError({
      code: 'CONFLICT',
      message: 'A program with this code already exists.',
      details: { field: 'code' },
    }),
    VALUES,
  );

  assert.equal(result?.fieldErrors?.code, 'A program with this code already exists.');
});
