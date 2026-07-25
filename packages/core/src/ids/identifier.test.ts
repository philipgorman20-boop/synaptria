import assert from 'node:assert/strict';
import test from 'node:test';

import { identifier, programId, projectId } from './identifier';

test('programId returns a trimmed branded ProgramId', () => {
  const id = programId('  program-1  ');
  assert.equal(id, 'program-1');
});

test('programId rejects empty values', () => {
  assert.throws(() => programId(''), /ProgramId cannot be empty/);
  assert.throws(() => programId('   '), /ProgramId cannot be empty/);
});

test('projectId returns a trimmed branded ProjectId', () => {
  const id = projectId('  project-1  ');
  assert.equal(id, 'project-1');
});

test('projectId rejects empty values', () => {
  assert.throws(() => projectId(''), /ProjectId cannot be empty/);
  assert.throws(() => projectId('   '), /ProjectId cannot be empty/);
});

test('identifier creates distinct branded types by name', () => {
  const value = 'shared-id';
  assert.equal(identifier(value, 'ProgramId'), value);
  assert.equal(identifier(value, 'OrganizationId'), value);
});
