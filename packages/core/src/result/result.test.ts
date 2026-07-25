import assert from 'node:assert/strict';
import test from 'node:test';

import { failure, mapResult, success, unwrapResult } from './result';

test('mapResult maps successful values', () => {
  assert.deepEqual(mapResult(success(2), (value) => value * 3), success(6));
});

test('mapResult preserves failures', () => {
  const result = failure('nope');
  assert.strictEqual(mapResult(result, () => 1), result);
});

test('unwrapResult returns success and throws failure', () => {
  assert.equal(unwrapResult(success('ok')), 'ok');
  assert.throws(() => unwrapResult(failure(new Error('failed'))), /failed/);
});
