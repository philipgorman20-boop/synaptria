import assert from 'node:assert/strict';
import test from 'node:test';

import { ApplicationError } from '@synaptria/application';

import { getMilestoneAction } from './get-milestone';
import { listProjectMilestonesAction } from './list-project-milestones';

test('listProjectMilestonesAction rejects malformed project identifiers', async () => {
  await assert.rejects(
    listProjectMilestonesAction('project-1'),
    (error: unknown) =>
      error instanceof ApplicationError &&
      error.code === 'VALIDATION_FAILED' &&
      error.details?.field === 'projectId',
  );
});

test('getMilestoneAction rejects malformed milestone identifiers', async () => {
  await assert.rejects(
    getMilestoneAction('milestone-1'),
    (error: unknown) =>
      error instanceof ApplicationError &&
      error.code === 'VALIDATION_FAILED' &&
      error.details?.field === 'milestoneId',
  );
});
