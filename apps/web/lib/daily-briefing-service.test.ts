import assert from 'node:assert/strict';
import test from 'node:test';

import { DailyBriefingService } from '@synaptria/application';

import { getDailyBriefingService } from './daily-briefing-service';

test('getDailyBriefingService returns a wired DailyBriefingService facade', () => {
  const service = getDailyBriefingService();

  assert.ok(service instanceof DailyBriefingService);
  assert.equal(typeof service.getSnapshot, 'function');
});
