import assert from 'node:assert/strict';
import test from 'node:test';

import {
  addUtcDays,
  normalizeSeedReferenceDate,
  resolveDemoDate,
  resolveDemoDateOffsetDay,
  resolveRecentEventDate,
} from './dates';

test('normalizeSeedReferenceDate anchors to UTC midday', () => {
  const reference = normalizeSeedReferenceDate(new Date('2026-07-26T08:15:30.000Z'));
  assert.equal(reference.toISOString(), '2026-07-26T12:00:00.000Z');
});

test('resolveDemoDateOffsetDay stays within configured ranges', () => {
  assert.equal(resolveDemoDateOffsetDay('deep_overdue', 0), -20);
  assert.equal(resolveDemoDateOffsetDay('recent_overdue', 0), -5);
  assert.equal(resolveDemoDateOffsetDay('due_soon', 0), 1);
  assert.equal(resolveDemoDateOffsetDay('future', 0), 14);
});

test('resolveDemoDate applies deterministic offsets from a single reference', () => {
  const reference = normalizeSeedReferenceDate(new Date('2026-07-26T15:00:00.000Z'));
  const dueSoon = resolveDemoDate(reference, 'due_soon', 2);
  assert.equal(dueSoon.toISOString(), addUtcDays(reference, 3).toISOString());
});

test('resolveRecentEventDate produces stable recent timestamps', () => {
  const reference = normalizeSeedReferenceDate(new Date('2026-07-26T12:00:00.000Z'));
  const first = resolveRecentEventDate(reference, 0);
  const second = resolveRecentEventDate(reference, 1);
  assert.ok(first.getTime() < reference.getTime());
  assert.ok(second.getTime() < first.getTime());
});
