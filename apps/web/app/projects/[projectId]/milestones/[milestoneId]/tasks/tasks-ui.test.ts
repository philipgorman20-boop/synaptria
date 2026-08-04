import assert from 'node:assert/strict';
import test from 'node:test';

import { milestoneId, projectId, taskId } from '@synaptria/core';

import {
  formatTaskPriority,
  formatTaskStatus,
  getNewTaskHref,
  getTaskDetailHref,
  shouldShowCreateTaskControl,
} from '../../../../../../lib/tasks-format';
import { TASKS_LIST_LOADING_LABEL } from './components/tasks-list-skeleton';
import { TASK_TABLE_COLUMNS } from './components/tasks-list';
import { TASKS_ERROR_HEADING, TASKS_ERROR_ROLE } from './error';

const PROJECT_UUID = '550e8400-e29b-41d4-a716-446655440000';
const MILESTONE_UUID = '660e8400-e29b-41d4-a716-446655440001';
const TASK_UUID = '770e8400-e29b-41d4-a716-446655440002';

test('task status and priority badges render readable labels', () => {
  assert.equal(formatTaskStatus('IN_PROGRESS'), 'In progress');
  assert.equal(formatTaskPriority('HIGH'), 'High');
});

test('task list table exposes expected column headers', () => {
  assert.deepEqual(TASK_TABLE_COLUMNS, [
    'Task',
    'Status',
    'Priority',
    'Planned end',
    'Actual end',
  ]);
});

test('task list rows link to the task detail route', () => {
  assert.equal(
    getTaskDetailHref(
      projectId(PROJECT_UUID),
      milestoneId(MILESTONE_UUID),
      taskId(TASK_UUID),
    ),
    `/projects/${PROJECT_UUID}/milestones/${MILESTONE_UUID}/tasks/${TASK_UUID}`,
  );
});

test('new task control links to the task create route', () => {
  assert.equal(
    getNewTaskHref(projectId(PROJECT_UUID), milestoneId(MILESTONE_UUID)),
    `/projects/${PROJECT_UUID}/milestones/${MILESTONE_UUID}/tasks/new`,
  );
});

test('shouldShowCreateTaskControl follows manage permission', () => {
  assert.equal(shouldShowCreateTaskControl(true), true);
  assert.equal(shouldShowCreateTaskControl(false), false);
});

test('task loading skeleton exposes accessible loading semantics', () => {
  assert.equal(TASKS_LIST_LOADING_LABEL, 'Loading tasks');
});

test('task error boundary exposes alert semantics and heading', () => {
  assert.equal(TASKS_ERROR_ROLE, 'alert');
  assert.equal(TASKS_ERROR_HEADING, 'Tasks unavailable');
});
