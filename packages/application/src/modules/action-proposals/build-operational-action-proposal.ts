import type {
  ActionProposal,
  ActionProposalChange,
  ActionProposalPrecondition,
} from '@synaptria/domain/action-proposals';
import { isValidActionProposal } from '@synaptria/domain/action-proposals';

import type { Recommendation } from '../recommendations/types';
import { buildActionProposalId } from './build-action-proposal-id';
import { buildRecommendationEvidenceKeys } from './build-action-proposal-from-recommendation';
import type { ActionProposalActionType } from './constants';
import { getAllowlistedMutableFieldsForTarget, getAllowlistedPreconditionFieldsForTarget } from './mutable-field-allowlist';

export interface BuildOperationalActionProposalInput {
  readonly recommendation: Recommendation;
  readonly actionType: ActionProposalActionType;
  readonly title: string;
  readonly description: string;
  readonly proposedChanges: readonly ActionProposalChange[];
  readonly preconditions: readonly ActionProposalPrecondition[];
}

export function buildOperationalActionProposal(
  input: BuildOperationalActionProposalInput,
): ActionProposal | null {
  const evidenceKeys = buildRecommendationEvidenceKeys(input.recommendation);
  if (evidenceKeys.length === 0) {
    return null;
  }

  const mutableFields = getAllowlistedMutableFieldsForTarget(
    input.recommendation.targetEntity.entityType,
  );
  const preconditionFields = getAllowlistedPreconditionFieldsForTarget(
    input.recommendation.targetEntity.entityType,
  );

  const proposal: ActionProposal = {
    id: buildActionProposalId(input.recommendation.id),
    organizationId: input.recommendation.targetEntity.organizationId,
    recommendationId: input.recommendation.id,
    recommendationType: input.recommendation.type,
    actionType: input.actionType,
    proposalKind: 'OPERATIONAL',
    target: {
      entityType: input.recommendation.targetEntity.entityType,
      entityId: input.recommendation.targetEntity.entityId,
    },
    title: input.title,
    description: input.description,
    proposedChanges: input.proposedChanges,
    preconditions: input.preconditions,
    evidenceKeys,
    status: 'PROPOSED',
    createdAt: input.recommendation.generatedAt,
  };

  const validationOptions =
    mutableFields === undefined && preconditionFields === undefined
      ? undefined
      : {
          ...(mutableFields === undefined ? {} : { mutableFields }),
          ...(preconditionFields === undefined ? {} : { preconditionFields }),
        };

  if (!isValidActionProposal(proposal, validationOptions)) {
    return null;
  }

  return proposal;
}
