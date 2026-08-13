import assert from 'node:assert/strict';
import test from 'node:test';

import { ApplicationError } from '@synaptria/application';
import { AuthorizationDeniedError } from '@synaptria/core/errors';

import {
  mapReviewRecommendationActionError,
  readReviewRecommendationFormValues,
} from './review-recommendation-form';

test('readReviewRecommendationFormValues rejects missing recommendation IDs', () => {
  assert.throws(
    () => readReviewRecommendationFormValues(new FormData()),
    (error: unknown) => error instanceof ApplicationError,
  );
});

test('readReviewRecommendationFormValues does not accept organization IDs from form data', () => {
  const formData = new FormData();
  formData.set('recommendationId', 'rec-1');
  formData.set('organizationId', 'org-attacker');

  const values = readReviewRecommendationFormValues(formData);
  assert.equal(values.recommendationId, 'rec-1');
  assert.equal('organizationId' in values, false);
});

test('mapReviewRecommendationActionError maps authorization failures to accessible labels', () => {
  const mapped = mapReviewRecommendationActionError(new AuthorizationDeniedError('denied'));
  assert.match(mapped?.message ?? '', /permission/i);
});
