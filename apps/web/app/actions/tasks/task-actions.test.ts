import assert from 'node:assert/strict';
import test from 'node:test';

import { ApplicationError } from '@synaptria/application';

import { getTaskAction } from './get-task';
import { listMilestoneTasksAction } from './list-milestone-tasks';

test('listMilestoneTasksAction rejects malformed milestone identifiers', async () => {
  await assert.rejects(
    listMilestoneTasksAction('milestone-1'),
    (error: unknown) =>
      error instanceof ApplicationError &&
      error.code === 'VALIDATION_FAILED' &&
      error.details?.field === 'milestoneId',
  );
});

test('getTaskAction rejects malformed task identifiers', async () => {
  await assert.rejects(
    getTaskAction('task-1'),
    (error: unknown) =>
      error instanceof ApplicationError &&
      error.code === 'VALIDATION_FAILED' &&
      error.details?.field === 'taskId',
  );
});
