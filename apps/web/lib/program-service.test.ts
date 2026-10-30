import assert from 'node:assert/strict';
import test from 'node:test';

import { ProgramService } from '@synaptria/application';

import { getProgramService } from './program-service';

test('getProgramService returns a wired ProgramService facade', () => {
  const service = getProgramService();

  assert.ok(service instanceof ProgramService);
  assert.equal(typeof service.createProgram, 'function');
  assert.equal(typeof service.listPrograms, 'function');
  assert.equal(typeof service.getProgram, 'function');
});
