import assert from 'node:assert/strict';
import test from 'node:test';

import { programId, projectId } from '@synaptria/core';
import type { Program } from '@synaptria/domain/programs';
import { organizationId } from '@synaptria/core';

import {
  formatProjectDate,
  formatProjectPercentComplete,
  formatProjectPriority,
  formatProjectProgramAssociation,
  formatProjectProgramOptionLabel,
  formatProjectStatus,
  getProjectDetailHref,
  shouldShowCreateProjectControl,
  toProjectProgramOptions,
} from './projects-format';

const ORGANIZATION_ID = organizationId('org-1');
const NOW = new Date('2026-07-22T12:00:00.000Z');

test('formatProjectStatus returns readable labels', () => {
  assert.equal(formatProjectStatus('PLANNED'), 'Planned');
  assert.equal(formatProjectStatus('ON_HOLD'), 'On hold');
});

test('formatProjectPriority returns readable labels', () => {
  assert.equal(formatProjectPriority('CRITICAL'), 'Critical');
});

test('formatProjectPercentComplete renders a percentage label', () => {
  assert.equal(formatProjectPercentComplete(0), '0%');
  assert.equal(formatProjectPercentComplete(42), '42%');
});

test('getProjectDetailHref builds the project detail route', () => {
  assert.equal(
    getProjectDetailHref(projectId('550e8400-e29b-41d4-a716-446655440000')),
    '/projects/550e8400-e29b-41d4-a716-446655440000',
  );
});

test('formatProjectProgramAssociation avoids raw program identifiers', () => {
  assert.equal(formatProjectProgramAssociation(undefined), 'Organization-level');
  assert.equal(
    formatProjectProgramAssociation(programId('550e8400-e29b-41d4-a716-446655440000')),
    'Program-linked',
  );
});

test('shouldShowCreateProjectControl follows manage permission', () => {
  assert.equal(shouldShowCreateProjectControl(true), true);
  assert.equal(shouldShowCreateProjectControl(false), false);
});

test('toProjectProgramOptions returns tenant-safe program select options', () => {
  const options = toProjectProgramOptions([
    programFixture('program-b', 'Beta Program', 'BETA'),
    programFixture('program-a', 'Alpha Program'),
    programFixture('program-deleted', 'Deleted Program', undefined, NOW),
  ]);

  assert.deepEqual(options, [
    { id: 'program-a', name: 'Alpha Program' },
    { id: 'program-b', name: 'Beta Program', code: 'BETA' },
  ]);
});

test('formatProjectProgramOptionLabel includes code when present', () => {
  assert.equal(
    formatProjectProgramOptionLabel({ id: 'program-1', name: 'Oncology Portfolio' }),
    'Oncology Portfolio',
  );
  assert.equal(
    formatProjectProgramOptionLabel({
      id: 'program-1',
      name: 'Oncology Portfolio',
      code: 'ONCO',
    }),
    'Oncology Portfolio (ONCO)',
  );
});

test('formatProjectDate uses the configured locale', () => {
  const formatted = formatProjectDate(new Date('2026-07-22T12:00:00.000Z'));
  assert.match(formatted, /2026/);
  assert.match(formatted, /Jul/);
});

function programFixture(
  id: string,
  name: string,
  code?: string,
  deletedAt?: Date,
): Program {
  return {
    id: programId(id),
    organizationId: ORGANIZATION_ID,
    name,
    ...(code === undefined ? {} : { code }),
    status: 'CONCEPT',
    priority: 'MEDIUM',
    ...(deletedAt === undefined ? {} : { deletedAt }),
    createdAt: NOW,
    updatedAt: NOW,
  };
}
