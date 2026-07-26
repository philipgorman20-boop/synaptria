import assert from 'node:assert/strict';
import test from 'node:test';

import { isPriority, PRIORITIES } from './priority';

test('PRIORITIES includes the supported priority values', () => {
  assert.deepEqual(PRIORITIES, ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL']);
});

test('isPriority validates supported priority values', () => {
  assert.equal(isPriority('LOW'), true);
  assert.equal(isPriority('MEDIUM'), true);
  assert.equal(isPriority('HIGH'), true);
  assert.equal(isPriority('CRITICAL'), true);
  assert.equal(isPriority('URGENT'), false);
});
