import assert from 'node:assert/strict';
import test from 'node:test';

import { milestoneId, projectId } from '@synaptria/core';

import {
  formatMilestonePriority,
  formatMilestoneStatus,
  getMilestoneDetailHref,
  getNewMilestoneHref,
} from '../../../../lib/milestones-format';
import { MILESTONES_LIST_LOADING_LABEL } from './components/milestones-list-skeleton';
import { MILESTONE_TABLE_COLUMNS } from './components/milestones-list';
import {
  MILESTONES_ERROR_HEADING,
  MILESTONES_ERROR_ROLE,
} from './error';

const PROJECT_UUID = '550e8400-e29b-41d4-a716-446655440000';
const MILESTONE_UUID = '660e8400-e29b-41d4-a716-446655440001';

test('milestone status and priority badges render readable labels', () => {
  assert.equal(formatMilestoneStatus('IN_PROGRESS'), 'In progress');
  assert.equal(formatMilestonePriority('HIGH'), 'High');
});

test('milestone list table exposes expected column headers', () => {
  assert.deepEqual(MILESTONE_TABLE_COLUMNS, [
    'Milestone',
    'Status',
    'Priority',
    'Planned end',
    'Actual end',
  ]);
});

test('milestone list rows link to the milestone detail route', () => {
  assert.equal(
    getMilestoneDetailHref(projectId(PROJECT_UUID), milestoneId(MILESTONE_UUID)),
    `/projects/${PROJECT_UUID}/milestones/${MILESTONE_UUID}`,
  );
});

test('new milestone control links to the milestone create route', () => {
  assert.equal(
    getNewMilestoneHref(projectId(PROJECT_UUID)),
    `/projects/${PROJECT_UUID}/milestones/new`,
  );
});

test('milestone loading skeleton exposes accessible loading semantics', () => {
  assert.equal(MILESTONES_LIST_LOADING_LABEL, 'Loading milestones');
});

test('milestone error boundary exposes alert semantics and heading', () => {
  assert.equal(MILESTONES_ERROR_ROLE, 'alert');
  assert.equal(MILESTONES_ERROR_HEADING, 'Milestones unavailable');
});
