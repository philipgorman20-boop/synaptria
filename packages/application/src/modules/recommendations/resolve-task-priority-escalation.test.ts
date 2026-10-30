import assert from 'node:assert/strict';
import test from 'node:test';

import { resolveTaskPriorityEscalationTarget } from './resolve-task-priority-escalation';

test('resolveTaskPriorityEscalationTarget escalates LOW and MEDIUM to HIGH', () => {
  assert.equal(resolveTaskPriorityEscalationTarget('LOW'), 'HIGH');
  assert.equal(resolveTaskPriorityEscalationTarget('MEDIUM'), 'HIGH');
});

test('resolveTaskPriorityEscalationTarget does not escalate HIGH or CRITICAL', () => {
  assert.equal(resolveTaskPriorityEscalationTarget('HIGH'), null);
  assert.equal(resolveTaskPriorityEscalationTarget('CRITICAL'), null);
});
