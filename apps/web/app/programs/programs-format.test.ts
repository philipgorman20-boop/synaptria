import assert from 'node:assert/strict';
import test from 'node:test';

import { programId } from '@synaptria/core';

import {
  formatProgramDate,
  formatProgramPriority,
  formatProgramStatus,
  getProgramDetailHref,
} from './programs-format';

test('formatProgramStatus returns readable labels', () => {
  assert.equal(formatProgramStatus('ON_HOLD'), 'On hold');
  assert.equal(formatProgramStatus('IND_ENABLING'), 'IND enabling');
});

test('formatProgramPriority returns readable labels', () => {
  assert.equal(formatProgramPriority('CRITICAL'), 'Critical');
  assert.equal(formatProgramPriority('MEDIUM'), 'Medium');
});

test('formatProgramDate uses the configured locale', () => {
  const formatted = formatProgramDate(new Date('2026-07-22T12:00:00.000Z'));
  assert.match(formatted, /2026/);
  assert.match(formatted, /Jul/);
});

test('getProgramDetailHref builds the portfolio detail route', () => {
  assert.equal(getProgramDetailHref(programId('program-1')), '/programs/program-1');
});
