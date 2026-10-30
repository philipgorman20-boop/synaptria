import assert from 'node:assert/strict';
import test from 'node:test';

import { TaskService } from '@synaptria/application';

import { getTaskService } from './task-service';

test('getTaskService returns a wired TaskService facade', () => {
  const service = getTaskService();

  assert.ok(service instanceof TaskService);
  assert.equal(typeof service.createTask, 'function');
  assert.equal(typeof service.listTasks, 'function');
  assert.equal(typeof service.listMilestoneTasks, 'function');
  assert.equal(typeof service.getTask, 'function');
});
