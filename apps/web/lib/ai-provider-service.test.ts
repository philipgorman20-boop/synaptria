import assert from 'node:assert/strict';
import test from 'node:test';

import { AIProviderService } from '@synaptria/ai';

import { getAIProviderService } from './ai-provider-service';

test('getAIProviderService returns a wired AIProviderService facade', () => {
  const service = getAIProviderService();

  assert.ok(service instanceof AIProviderService);
  assert.equal(typeof service.execute, 'function');
});
