import type { OrganizationId } from '@synaptria/core';
import type { OrganizationRole } from '@synaptria/core/context';
import { AuthorizationDeniedError } from '@synaptria/core/errors';

import type { DailyBriefingSnapshot } from '../daily-briefing/types';
import {
  createDefaultRecommendationsAccessPolicy,
  type RecommendationsAccessPolicy,
} from './access-policy';
import { buildRecommendationFromCandidate } from './build-recommendation-from-candidate';
import type { DailyBriefingSnapshotReader } from './daily-briefing-snapshot-reader';
import { deduplicateRecommendations } from './deduplicate-recommendations';
import { RECOMMENDATION_RULES } from './rules';
import { sortRecommendations } from './sort-recommendations';
import type { RecommendationsSnapshot } from './types';
import { validateRecommendationsHaveEvidence } from './validate-recommendations';

export interface GetRecommendationsContext {
  readonly organizationId: OrganizationId;
  readonly role: OrganizationRole;
}

export interface GenerateRecommendationsDependencies {
  readonly dailyBriefingSnapshotReader: DailyBriefingSnapshotReader;
  readonly accessPolicy?: RecommendationsAccessPolicy;
}

export class GenerateRecommendationsUseCase {
  private readonly accessPolicy: RecommendationsAccessPolicy;

  constructor(private readonly dependencies: GenerateRecommendationsDependencies) {
    this.accessPolicy =
      dependencies.accessPolicy ?? createDefaultRecommendationsAccessPolicy();
  }

  async execute(context: GetRecommendationsContext): Promise<RecommendationsSnapshot> {
    if (!this.accessPolicy.canAccessRecommendations(context.role)) {
      throw new AuthorizationDeniedError('Recommendations access denied.');
    }

    const snapshot = await this.dependencies.dailyBriefingSnapshotReader.getSnapshot({
      organizationId: context.organizationId,
      role: context.role,
    });

    return generateRecommendationsFromDailyBriefingSnapshot(snapshot);
  }
}

export function generateRecommendationsFromDailyBriefingSnapshot(
  snapshot: DailyBriefingSnapshot,
  generatedAt: Date = snapshot.generatedAt,
): RecommendationsSnapshot {
  const ruleContext = {
    snapshot,
    organizationId: snapshot.organization.organizationId,
    generatedAt,
  };

  const rawRecommendations = RECOMMENDATION_RULES.flatMap((rule) =>
    rule.evaluate(ruleContext)
      .map((candidate) =>
        buildRecommendationFromCandidate({
          candidate,
          snapshot,
          generatedAt,
        }),
      )
      .filter((recommendation): recommendation is NonNullable<typeof recommendation> =>
        recommendation !== null,
      ),
  );

  const recommendations = sortRecommendations(
    deduplicateRecommendations(rawRecommendations),
  );

  validateRecommendationsHaveEvidence(recommendations);

  return {
    generatedAt,
    organization: {
      organizationId: snapshot.organization.organizationId,
    },
    recommendations,
    completeness: snapshot.completeness,
    metadata: {
      deterministic: true,
      restrictedSlices: snapshot.metadata.restrictedSlices,
      sourceSnapshotGeneratedAt: snapshot.generatedAt,
    },
  };
}
