import assert from 'node:assert/strict';
import test from 'node:test';

import { MissionControlService } from '@synaptria/application';

import { getMissionControlService } from './mission-control-service';

test('getMissionControlService returns a wired MissionControlService facade', () => {
  const service = getMissionControlService();

  assert.ok(service instanceof MissionControlService);
  assert.equal(typeof service.getSnapshot, 'function');
});
