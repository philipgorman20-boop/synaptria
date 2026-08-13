import {
  Prisma,
  type RecommendationReviewDecision as PrismaRecommendationReviewDecision,
  type PrismaClient,
} from '@prisma/client';
import { identifier, userId, type OrganizationId } from '@synaptria/core';
import type {
  RecommendationReviewDecision,
  RecommendationReviewDecisionRepository,
  RecommendationReviewDecisionValue,
  UpsertRecommendationReviewDecisionInput,
} from '@synaptria/domain/recommendation-reviews';

export type RecommendationReviewDecisionDatabaseClient = Pick<
  PrismaClient,
  'recommendationReviewDecision'
>;

const DECISION_SELECT = {
  id: true,
  organizationId: true,
  recommendationId: true,
  decision: true,
  reviewedByUserId: true,
  reviewedAt: true,
  dismissalReason: true,
} as const satisfies Prisma.RecommendationReviewDecisionSelect;

type SelectedDecision = Prisma.RecommendationReviewDecisionGetPayload<{
  select: typeof DECISION_SELECT;
}>;

function mapDecisionValue(
  decision: PrismaRecommendationReviewDecision['decision'],
): RecommendationReviewDecisionValue {
  return decision === 'ACCEPTED' ? 'accepted' : 'dismissed';
}

function toPrismaDecisionValue(
  decision: RecommendationReviewDecisionValue,
): PrismaRecommendationReviewDecision['decision'] {
  return decision === 'accepted' ? 'ACCEPTED' : 'DISMISSED';
}

function mapDecision(row: SelectedDecision): RecommendationReviewDecision {
  return {
    id: row.id,
    organizationId: identifier(row.organizationId, 'OrganizationId'),
    recommendationId: row.recommendationId,
    decision: mapDecisionValue(row.decision),
    reviewedByUserId: userId(row.reviewedByUserId),
    reviewedAt: row.reviewedAt,
    ...(row.dismissalReason === null || row.dismissalReason === undefined
      ? {}
      : { dismissalReason: row.dismissalReason }),
  };
}

export class PrismaRecommendationReviewDecisionRepository
  implements RecommendationReviewDecisionRepository
{
  constructor(private readonly client: RecommendationReviewDecisionDatabaseClient) {}

  async upsert(
    input: UpsertRecommendationReviewDecisionInput,
  ): Promise<RecommendationReviewDecision> {
    const row = await this.client.recommendationReviewDecision.upsert({
      where: {
        organizationId_recommendationId: {
          organizationId: input.organizationId,
          recommendationId: input.recommendationId,
        },
      },
      create: {
        organizationId: input.organizationId,
        recommendationId: input.recommendationId,
        decision: toPrismaDecisionValue(input.decision),
        reviewedByUserId: input.reviewedByUserId,
        reviewedAt: input.reviewedAt,
        ...(input.dismissalReason === undefined
          ? {}
          : { dismissalReason: input.dismissalReason }),
      },
      update: {
        decision: toPrismaDecisionValue(input.decision),
        reviewedByUserId: input.reviewedByUserId,
        reviewedAt: input.reviewedAt,
        dismissalReason: input.dismissalReason ?? null,
      },
      select: DECISION_SELECT,
    });

    return mapDecision(row);
  }

  async findByRecommendationIds(
    organizationId: OrganizationId,
    recommendationIds: readonly string[],
  ): Promise<readonly RecommendationReviewDecision[]> {
    if (recommendationIds.length === 0) {
      return [];
    }

    const rows = await this.client.recommendationReviewDecision.findMany({
      where: {
        organizationId,
        recommendationId: { in: [...recommendationIds] },
      },
      select: DECISION_SELECT,
      orderBy: [{ recommendationId: 'asc' }],
    });

    return rows.map(mapDecision);
  }
}
