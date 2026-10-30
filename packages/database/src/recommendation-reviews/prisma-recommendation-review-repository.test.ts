import assert from 'node:assert/strict';
import test from 'node:test';

import { identifier, organizationId, userId } from '@synaptria/core';

import { PrismaRecommendationReviewDecisionRepository } from './prisma-recommendation-review-repository';

const ORGANIZATION_ID = organizationId('org-1');
const OTHER_ORGANIZATION_ID = organizationId('org-2');
const USER_ID = userId('user-1');
const REVIEWED_AT = new Date('2026-07-26T14:00:00.000Z');
const RECOMMENDATION_ID = 'rec:recommendations.resolve-blocked-critical-task.v0:entity:Task:task-blocked';

test('PrismaRecommendationReviewDecisionRepository upserts and reads organization-scoped decisions', async () => {
  const store = new Map<string, Record<string, unknown>>();

  const client = {
    recommendationReviewDecision: {
      upsert: async (args: {
        where: { organizationId_recommendationId: { organizationId: string; recommendationId: string } };
        create: Record<string, unknown>;
        update: Record<string, unknown>;
        select: Record<string, boolean>;
      }) => {
        const key = `${args.where.organizationId_recommendationId.organizationId}:${args.where.organizationId_recommendationId.recommendationId}`;
        const existing = store.get(key);
        const next = existing === undefined ? args.create : { ...existing, ...args.update };
        store.set(key, next);
        return {
          id: 'decision-1',
          organizationId: next.organizationId,
          recommendationId: next.recommendationId,
          decision: next.decision,
          reviewedByUserId: next.reviewedByUserId,
          reviewedAt: next.reviewedAt,
          dismissalReason: next.dismissalReason ?? null,
        };
      },
      findMany: async (args: {
        where: { organizationId: string; recommendationId: { in: string[] } };
      }) =>
        [...store.values()].filter(
          (record) =>
            record.organizationId === args.where.organizationId &&
            args.where.recommendationId.in.includes(String(record.recommendationId)),
        ),
    },
  };

  const repository = new PrismaRecommendationReviewDecisionRepository(client as never);

  const saved = await repository.upsert({
    organizationId: ORGANIZATION_ID,
    recommendationId: RECOMMENDATION_ID,
    decision: 'accepted',
    reviewedByUserId: USER_ID,
    reviewedAt: REVIEWED_AT,
  });

  assert.equal(saved.decision, 'accepted');
  assert.equal(saved.recommendationId, RECOMMENDATION_ID);

  const otherOrgDecision = await repository.upsert({
    organizationId: OTHER_ORGANIZATION_ID,
    recommendationId: RECOMMENDATION_ID,
    decision: 'dismissed',
    reviewedByUserId: USER_ID,
    reviewedAt: REVIEWED_AT,
  });
  assert.equal(otherOrgDecision.decision, 'dismissed');

  const currentOrg = await repository.findByRecommendationIds(ORGANIZATION_ID, [RECOMMENDATION_ID]);
  assert.equal(currentOrg.length, 1);
  assert.equal(currentOrg[0]?.decision, 'accepted');

  const transitioned = await repository.upsert({
    organizationId: ORGANIZATION_ID,
    recommendationId: RECOMMENDATION_ID,
    decision: 'dismissed',
    reviewedByUserId: USER_ID,
    reviewedAt: new Date('2026-07-26T15:00:00.000Z'),
    dismissalReason: 'Handled elsewhere',
  });

  assert.equal(transitioned.decision, 'dismissed');
  assert.equal(transitioned.dismissalReason, 'Handled elsewhere');
});

test('PrismaRecommendationReviewDecisionRepository returns empty results for empty ID lists', async () => {
  const repository = new PrismaRecommendationReviewDecisionRepository({
    recommendationReviewDecision: {
      findMany: async () => {
        throw new Error('findMany should not be called for empty ID lists');
      },
    },
  } as never);

  const results = await repository.findByRecommendationIds(ORGANIZATION_ID, []);
  assert.deepEqual(results, []);
});
