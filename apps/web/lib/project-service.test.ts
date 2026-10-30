import assert from 'node:assert/strict';
import test from 'node:test';

import { ProjectService } from '@synaptria/application';

import { getProjectService } from './project-service';

test('getProjectService returns a wired ProjectService facade', () => {
  const service = getProjectService();

  assert.ok(service instanceof ProjectService);
  assert.equal(typeof service.createProject, 'function');
  assert.equal(typeof service.listProjects, 'function');
  assert.equal(typeof service.listProgramProjects, 'function');
  assert.equal(typeof service.getProject, 'function');
});
