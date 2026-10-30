import assert from 'node:assert/strict';
import test from 'node:test';

import { MilestoneService } from '@synaptria/application';

import { getMilestoneService } from './milestone-service';

test('getMilestoneService returns a wired MilestoneService facade', () => {
  const service = getMilestoneService();

  assert.ok(service instanceof MilestoneService);
  assert.equal(typeof service.createMilestone, 'function');
  assert.equal(typeof service.listMilestones, 'function');
  assert.equal(typeof service.listProjectMilestones, 'function');
  assert.equal(typeof service.getMilestone, 'function');
});
