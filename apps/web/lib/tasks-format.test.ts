import assert from 'node:assert/strict';
import test from 'node:test';

import { milestoneId, projectId, taskId } from '@synaptria/core';

import {
  formatTaskPriority,
  formatTaskStatus,
  getTaskDetailHref,
  parseMilestoneRouteParamForTasks,
  parseProjectRouteParamForTasks,
  parseTaskRouteParam,
} from './tasks-format';

const PROJECT_UUID = '550e8400-e29b-41d4-a716-446655440000';
const MILESTONE_UUID = '660e8400-e29b-41d4-a716-446655440001';
const TASK_UUID = '770e8400-e29b-41d4-a716-446655440002';

test('formatTaskStatus and formatTaskPriority render readable labels', () => {
  assert.equal(formatTaskStatus('TODO'), 'To do');
  assert.equal(formatTaskPriority('CRITICAL'), 'Critical');
});

test('parseTaskRouteParam accepts a valid UUID task identifier', () => {
  assert.equal(parseTaskRouteParam(TASK_UUID), taskId(TASK_UUID));
});

test('parseTaskRouteParam rejects malformed task identifiers', () => {
  assert.equal(parseTaskRouteParam('task-1'), null);
  assert.equal(parseTaskRouteParam(undefined), null);
});

test('parseMilestoneRouteParamForTasks accepts valid milestone identifiers', () => {
  assert.equal(
    parseMilestoneRouteParamForTasks(MILESTONE_UUID),
    milestoneId(MILESTONE_UUID),
  );
});

test('parseProjectRouteParamForTasks accepts valid project identifiers', () => {
  assert.equal(
    parseProjectRouteParamForTasks(PROJECT_UUID),
    projectId(PROJECT_UUID),
  );
});

test('getTaskDetailHref builds nested task detail routes', () => {
  assert.equal(
    getTaskDetailHref(
      projectId(PROJECT_UUID),
      milestoneId(MILESTONE_UUID),
      taskId(TASK_UUID),
    ),
    `/projects/${PROJECT_UUID}/milestones/${MILESTONE_UUID}/tasks/${TASK_UUID}`,
  );
});
