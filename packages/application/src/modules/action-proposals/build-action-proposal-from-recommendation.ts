import { dailyBriefingEvidenceKey } from '../daily-briefing/evidence-keys';
import type { Recommendation } from '../recommendations/types';
import type { ActionProposal } from '@synaptria/domain/action-proposals';

import { buildActionProposalId } from './build-action-proposal-id';
import { RECOMMENDATION_TYPE_TO_ACTION_PROPOSAL_ACTION_TYPE } from './constants';

export function buildRecommendationEvidenceKeys(
  recommendation: Recommendation,
): readonly string[] {
  return [...recommendation.evidence.map(dailyBriefingEvidenceKey)].sort((left, right) =>
    left.localeCompare(right, 'en', { sensitivity: 'base' }),
  );
}

export function isSupportedActionProposalRecommendation(
  recommendation: Recommendation,
): boolean {
  return recommendation.type in RECOMMENDATION_TYPE_TO_ACTION_PROPOSAL_ACTION_TYPE;
}

export function buildActionProposalFromRecommendation(
  recommendation: Recommendation,
): ActionProposal | null {
  const actionType = RECOMMENDATION_TYPE_TO_ACTION_PROPOSAL_ACTION_TYPE[recommendation.type];
  if (actionType === undefined) {
    return null;
  }

  const evidenceKeys = buildRecommendationEvidenceKeys(recommendation);
  if (evidenceKeys.length === 0) {
    return null;
  }

  return {
    id: buildActionProposalId(recommendation.id),
    organizationId: recommendation.targetEntity.organizationId,
    recommendationId: recommendation.id,
    recommendationType: recommendation.type,
    actionType,
    proposalKind: 'ADVISORY',
    target: {
      entityType: recommendation.targetEntity.entityType,
      entityId: recommendation.targetEntity.entityId,
    },
    title: `Advisory review: ${recommendation.title}`,
    description: recommendation.proposedAction.description,
    proposedChanges: [],
    evidenceKeys,
    status: 'PROPOSED',
    createdAt: recommendation.generatedAt,
  };
}

export function buildUnsupportedActionProposalResult(
  recommendationId: string,
  reason: string,
): { readonly kind: 'unsupported'; readonly recommendationId: string; readonly reason: string } {
  return {
    kind: 'unsupported',
    recommendationId,
    reason,
  };
}
