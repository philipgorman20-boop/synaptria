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
  getProjectsListHref,
  parseProjectRouteParam,
  resolveProjectProgramDisplay,
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

test('getProjectsListHref builds the projects list route', () => {
  assert.equal(getProjectsListHref(), '/projects');
});

test('parseProjectRouteParam accepts a valid UUID project id', () => {
  const id = '550e8400-e29b-41d4-a716-446655440000';
  assert.equal(parseProjectRouteParam(id), projectId(id));
  assert.equal(parseProjectRouteParam(`  ${id}  `), projectId(id));
});

test('parseProjectRouteParam rejects invalid route params', () => {
  assert.equal(parseProjectRouteParam(undefined), null);
  assert.equal(parseProjectRouteParam(''), null);
  assert.equal(parseProjectRouteParam('   '), null);
  assert.equal(parseProjectRouteParam('project-1'), null);
  assert.equal(parseProjectRouteParam('not-a-uuid'), null);
});

test('resolveProjectProgramDisplay shows organization-level projects without raw ids', () => {
  assert.deepEqual(resolveProjectProgramDisplay(undefined, null), {
    kind: 'organization-level',
    label: 'Organization-level',
  });
});

test('resolveProjectProgramDisplay links accessible parent programs', () => {
  const linkedProgramId = programId('550e8400-e29b-41d4-a716-446655440001');

  assert.deepEqual(
    resolveProjectProgramDisplay(
      linkedProgramId,
      programFixture('550e8400-e29b-41d4-a716-446655440001', 'Oncology Portfolio', 'ONCO'),
    ),
    {
      kind: 'linked',
      label: 'Oncology Portfolio (ONCO)',
      href: '/programs/550e8400-e29b-41d4-a716-446655440001',
    },
  );
});

test('resolveProjectProgramDisplay hides unavailable parent programs safely', () => {
  assert.deepEqual(
    resolveProjectProgramDisplay(
      programId('550e8400-e29b-41d4-a716-446655440001'),
      null,
    ),
    {
      kind: 'unavailable',
      label: 'Program unavailable',
    },
  );
  assert.deepEqual(
    resolveProjectProgramDisplay(
      programId('550e8400-e29b-41d4-a716-446655440001'),
      programFixture('550e8400-e29b-41d4-a716-446655440001', 'Deleted Program', undefined, NOW),
    ),
    {
      kind: 'unavailable',
      label: 'Program unavailable',
    },
  );
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
