import assert from 'node:assert/strict';
import test from 'node:test';

import { RecommendationService } from '@synaptria/application';

import { getRecommendationService } from './recommendation-service';

test('getRecommendationService returns a wired RecommendationService facade', () => {
  const service = getRecommendationService();

  assert.ok(service instanceof RecommendationService);
  assert.equal(typeof service.getRecommendations, 'function');
});
