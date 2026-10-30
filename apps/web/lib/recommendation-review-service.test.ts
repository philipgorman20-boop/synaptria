import assert from 'node:assert/strict';
import test from 'node:test';

import { RecommendationReviewService } from '@synaptria/application';

import { getRecommendationReviewService } from './recommendation-review-service';

test('getRecommendationReviewService returns a wired RecommendationReviewService facade', () => {
  const service = getRecommendationReviewService();

  assert.ok(service instanceof RecommendationReviewService);
  assert.equal(typeof service.getReviewSnapshot, 'function');
  assert.equal(typeof service.acceptRecommendation, 'function');
  assert.equal(typeof service.dismissRecommendation, 'function');
});
