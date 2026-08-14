import type { OrganizationId } from '@synaptria/core';
import type { ActionProposal } from '@synaptria/domain/action-proposals';

import type { Recommendation } from '../recommendations/types';
import { buildAdvisoryActionProposalFromRecommendation } from './build-advisory-action-proposal';
import { buildOperationalActionProposal } from './build-operational-action-proposal';
import { buildOperationalTaskPriorityProposalFromRecommendation } from './build-operational-task-priority-proposal';
import { evaluateOperationalMapping } from './evaluate-operational-mapping';
import type { ActionProposalActionType } from './constants';
import type { ActionProposalStateReaders } from './state-readers/types';

export interface BuildActionProposalFromRecommendationContext {
  readonly organizationId: OrganizationId;
  readonly stateReaders: ActionProposalStateReaders;
}

export interface BuildActionProposalResult {
  readonly proposal: ActionProposal;
  readonly mappingKind: 'ADVISORY' | 'OPERATIONAL';
  readonly operationalMappingReason?: string;
}

/**
 * Attempts an operational mapping first when eligible, otherwise falls back to advisory.
 * Recommendations with a valid, explicit, allowlisted proposedMutation may produce an
 * OPERATIONAL Action Proposal; recommendation types without such a deterministic proposed
 * mutation remain ADVISORY. Proposed field values are never inferred from recommendation prose.
 */
export async function buildActionProposalFromAcceptedRecommendation(
  recommendation: Recommendation,
  context: BuildActionProposalFromRecommendationContext,
): Promise<BuildActionProposalResult | null> {
  const operationalEvaluation = evaluateOperationalMapping(recommendation);
  if (operationalEvaluation.eligible) {
    const operationalProposal = await buildOperationalActionProposalForRecommendation(
      recommendation,
      context,
    );

    if (operationalProposal !== null) {
      return {
        proposal: operationalProposal,
        mappingKind: 'OPERATIONAL',
      };
    }

    return null;
  }

  const advisoryProposal = buildAdvisoryActionProposalFromRecommendation(recommendation);
  if (advisoryProposal === null) {
    return null;
  }

  return {
    proposal: advisoryProposal,
    mappingKind: 'ADVISORY',
    operationalMappingReason: operationalEvaluation.reason,
  };
}

async function buildOperationalActionProposalForRecommendation(
  recommendation: Recommendation,
  context: BuildActionProposalFromRecommendationContext,
): Promise<ActionProposal | null> {
  switch (recommendation.type) {
    case 'escalate_blocked_overdue_task_priority':
      return buildOperationalTaskPriorityProposalFromRecommendation(recommendation, context);
    default:
      return null;
  }
}

export function buildOperationalActionProposalForTests(
  recommendation: Recommendation,
  input: {
    readonly actionType: ActionProposalActionType;
    readonly title: string;
    readonly description: string;
    readonly proposedChanges: Parameters<typeof buildOperationalActionProposal>[0]['proposedChanges'];
    readonly preconditions: Parameters<typeof buildOperationalActionProposal>[0]['preconditions'];
  },
): ActionProposal | null {
  return buildOperationalActionProposal({
    recommendation,
    ...input,
  });
}

export {
  buildAdvisoryActionProposalFromRecommendation,
  buildActionProposalFromRecommendation,
  buildRecommendationEvidenceKeys,
  buildUnsupportedActionProposalResult,
  isSupportedActionProposalRecommendation,
} from './build-advisory-action-proposal';
