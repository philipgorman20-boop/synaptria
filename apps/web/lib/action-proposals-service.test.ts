import assert from 'node:assert/strict';
import test from 'node:test';

import { ActionProposalsService } from '@synaptria/application';

import { getActionProposalsService } from './action-proposals-service';

test('getActionProposalsService returns a wired ActionProposalsService facade', () => {
  const service = getActionProposalsService();

  assert.ok(service instanceof ActionProposalsService);
  assert.equal(typeof service.getActionProposals, 'function');
  assert.equal(typeof service.getActionProposal, 'function');
});
