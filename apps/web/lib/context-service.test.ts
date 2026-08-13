import assert from 'node:assert/strict';
import test from 'node:test';

import { ContextAssemblerService } from '@synaptria/application';

import { getContextService } from './context-service';

test('getContextService returns a wired ContextAssemblerService facade', () => {
  const service = getContextService();

  assert.ok(service instanceof ContextAssemblerService);
  assert.equal(typeof service.assembleContext, 'function');
});
