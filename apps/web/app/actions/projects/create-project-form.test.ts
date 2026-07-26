import assert from 'node:assert/strict';
import test from 'node:test';

import { ApplicationError } from '@synaptria/application';
import { programId } from '@synaptria/core';
import { CoreError } from '@synaptria/core/errors';
import { AuthorizationDeniedError } from '@synaptria/core/errors';

import {
  mapCreateProjectActionError,
  readCreateProjectFormValues,
  resolveSuggestedProjectCode,
  suggestProjectCodeFromName,
  toCreateProjectInput,
  validateCreateProjectFormValues,
} from './create-project-form';

const PROGRAM_UUID = '550e8400-e29b-41d4-a716-446655440000';

const VALUES = {
  name: 'Lead Candidate Study',
  code: 'LC-001',
  description: 'Primary study',
  programId: PROGRAM_UUID,
};

test('readCreateProjectFormValues trims submitted fields', () => {
  const formData = new FormData();
  formData.set('name', '  Lead Candidate Study  ');
  formData.set('code', ' LC-001 ');
  formData.set('description', ' Primary study ');
  formData.set('programId', ` ${PROGRAM_UUID} `);

  assert.deepEqual(readCreateProjectFormValues(formData), VALUES);
});

test('validateCreateProjectFormValues requires a project name', () => {
  const result = validateCreateProjectFormValues({
    ...VALUES,
    name: '   ',
  });

  assert.equal(result?.status, 'error');
  assert.equal(result?.fieldErrors?.name, 'Project name is required.');
  assert.deepEqual(result?.values, { ...VALUES, name: '   ' });
});

test('validateCreateProjectFormValues rejects invalid code formats', () => {
  const result = validateCreateProjectFormValues({
    ...VALUES,
    code: 'bad code!',
  });

  assert.equal(result?.status, 'error');
  assert.equal(
    result?.fieldErrors?.code,
    'Use letters, numbers, and single hyphens only.',
  );
});

test('validateCreateProjectFormValues accepts a valid optional programId', () => {
  const result = validateCreateProjectFormValues(VALUES);

  assert.equal(result, undefined);
});

test('validateCreateProjectFormValues treats empty programId as optional', () => {
  const result = validateCreateProjectFormValues({
    ...VALUES,
    programId: '   ',
  });

  assert.equal(result, undefined);
});

test('validateCreateProjectFormValues rejects malformed programId values', () => {
  const result = validateCreateProjectFormValues({
    ...VALUES,
    programId: 'program-1',
  });

  assert.equal(result?.status, 'error');
  assert.equal(result?.fieldErrors?.programId, 'Select a valid program.');
});

test('toCreateProjectInput omits empty optional values', () => {
  assert.deepEqual(
    toCreateProjectInput({
      name: 'Standalone Project',
      code: '   ',
      description: '',
      programId: '',
    }),
    { name: 'Standalone Project' },
  );
});

test('toCreateProjectInput maps validated optional fields', () => {
  assert.deepEqual(toCreateProjectInput(VALUES), {
    name: 'Lead Candidate Study',
    code: 'LC-001',
    description: 'Primary study',
    programId: programId(PROGRAM_UUID),
  });
});

test('mapCreateProjectActionError maps application validation failures to field errors', () => {
  const result = mapCreateProjectActionError(
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

test('mapCreateProjectActionError maps authorization failures', () => {
  const result = mapCreateProjectActionError(
    new AuthorizationDeniedError(),
    VALUES,
  );

  assert.equal(result?.message, 'You do not have permission to create projects.');
});

test('mapCreateProjectActionError maps duplicate name conflicts', () => {
  const result = mapCreateProjectActionError(
    new ApplicationError({
      code: 'CONFLICT',
      message: 'A project with this name already exists.',
      details: { field: 'name' },
    }),
    VALUES,
  );

  assert.equal(result?.fieldErrors?.name, 'A project with this name already exists.');
});

test('mapCreateProjectActionError maps duplicate code conflicts', () => {
  const result = mapCreateProjectActionError(
    new CoreError({
      code: 'CONFLICT',
      message: 'A project with this code already exists.',
      details: { field: 'code' },
    }),
    VALUES,
  );

  assert.equal(result?.fieldErrors?.code, 'A project with this code already exists.');
});

test('mapCreateProjectActionError maps inaccessible parent programs safely', () => {
  const result = mapCreateProjectActionError(
    new ApplicationError({
      code: 'NOT_FOUND',
      message: 'The requested program was not found.',
      details: { field: 'programId', programId: PROGRAM_UUID },
    }),
    VALUES,
  );

  assert.equal(result?.fieldErrors?.programId, 'The selected program is not available.');
  assert.equal(result?.message, 'Correct the highlighted fields and try again.');
});

test('mapCreateProjectActionError returns undefined for unexpected errors', () => {
  const result = mapCreateProjectActionError(new Error('database unavailable'), VALUES);

  assert.equal(result, undefined);
});

test('suggestProjectCodeFromName generates uppercase project codes', () => {
  assert.equal(
    suggestProjectCodeFromName('  Lead Candidate Study  '),
    'LEAD-CANDIDATE-STUDY',
  );
  assert.equal(suggestProjectCodeFromName('lc 001'), 'LC-001');
});

test('resolveSuggestedProjectCode preserves manually entered codes', () => {
  assert.equal(
    resolveSuggestedProjectCode('New Project', true, 'CUSTOM-CODE'),
    'CUSTOM-CODE',
  );
  assert.equal(
    resolveSuggestedProjectCode('New Project', false, ''),
    'NEW-PROJECT',
  );
});
