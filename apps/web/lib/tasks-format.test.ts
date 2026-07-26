import assert from 'node:assert/strict';
import test from 'node:test';

import { taskId } from '@synaptria/core';

import { parseTaskRouteParam } from './tasks-format';

const TASK_UUID = '660e8400-e29b-41d4-a716-446655440001';

test('parseTaskRouteParam accepts a valid UUID task identifier', () => {
  assert.equal(parseTaskRouteParam(TASK_UUID), taskId(TASK_UUID));
});

test('parseTaskRouteParam rejects malformed task identifiers', () => {
  assert.equal(parseTaskRouteParam('task-1'), null);
  assert.equal(parseTaskRouteParam(undefined), null);
});
