import assert from 'node:assert/strict';
import test from 'node:test';

import { DailyBriefingNarrativeService } from '@synaptria/application';

import { getDailyBriefingNarrativeService } from './daily-briefing-narrative-service';

test('getDailyBriefingNarrativeService returns a wired DailyBriefingNarrativeService facade', () => {
  const service = getDailyBriefingNarrativeService();

  assert.ok(service instanceof DailyBriefingNarrativeService);
  assert.equal(typeof service.generateNarrative, 'function');
});
