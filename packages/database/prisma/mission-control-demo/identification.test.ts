import assert from 'node:assert/strict';
import test from 'node:test';

import { MISSION_CONTROL_DEMO_CODE_PREFIX } from './constants';
import {
  isMissionControlDemoCode,
  isMissionControlDemoCorrelationId,
  isMissionControlDemoEventMetadata,
} from './identification';

test('isMissionControlDemoCode identifies demo codes by prefix', () => {
  assert.equal(isMissionControlDemoCode(`${MISSION_CONTROL_DEMO_CODE_PREFIX}PROJ-A`), true);
  assert.equal(isMissionControlDemoCode('PRODUCTION-001'), false);
  assert.equal(isMissionControlDemoCode(undefined), false);
});

test('isMissionControlDemoCorrelationId matches the demo seed correlation id', () => {
  assert.equal(isMissionControlDemoCorrelationId('mc-demo-seed-v1'), true);
  assert.equal(isMissionControlDemoCorrelationId('other'), false);
});

test('isMissionControlDemoEventMetadata detects seeded event metadata', () => {
  assert.equal(isMissionControlDemoEventMetadata({ seed: 'mission-control-demo' }), true);
  assert.equal(isMissionControlDemoEventMetadata({ source: 'app' }), false);
});
