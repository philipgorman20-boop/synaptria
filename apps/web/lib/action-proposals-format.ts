import { routes } from '@synaptria/config';
import type { ActionProposalListItem, RecommendationEvidenceItem } from '@synaptria/application';
import type { ActionProposal } from '@synaptria/domain/action-proposals';
import type { EntityReference } from '@synaptria/domain/context';
import type { EntityType } from '@synaptria/domain/context';

import {
  getRecommendationEntityHref,
} from './recommendations-format';

export const ACTION_PROPOSALS_ROUTE = routes.actionProposals;

export const ACTION_PROPOSALS_EYEBROW = 'ACTION PROPOSALS';
export const ACTION_PROPOSALS_TITLE = 'Action Proposals';
export const ACTION_PROPOSALS_SUBTITLE =
  'Inspect proposed operational changes derived from accepted recommendations. No actions are executed from this surface.';

export function formatActionProposalStatus(status: ActionProposal['status']): string {
  switch (status) {
    case 'PROPOSED':
      return 'Proposed';
    default:
      return status;
  }
}

export function formatActionProposalKind(kind: ActionProposal['proposalKind']): string {
  switch (kind) {
    case 'ADVISORY':
      return 'Advisory review';
    default:
      return kind;
  }
}

export function formatActionProposalActionType(actionType: ActionProposal['actionType']): string {
  switch (actionType) {
    case 'REQUEST_TASK_BLOCKER_REVIEW':
      return 'Task blocker review';
    case 'REQUEST_MILESTONE_RECOVERY_REVIEW':
      return 'Milestone recovery review';
    case 'REQUEST_WORKLOAD_REBALANCE_REVIEW':
      return 'Workload rebalance review';
    case 'REQUEST_PROJECT_RISK_REVIEW':
      return 'Project risk review';
    default:
      return actionType;
  }
}

export function formatActionProposalEntityLabel(reference: {
  readonly entityType: EntityType;
}): string {
  return reference.entityType;
}

export function formatActionProposalTarget(proposal: ActionProposal): string {
  return formatActionProposalEntityLabel({ entityType: proposal.target.entityType });
}

export function getActionProposalEvidenceHref(
  evidence: readonly RecommendationEvidenceItem[],
  reference: EntityReference,
): string | null {
  const directHref = getRecommendationEntityHref(reference);
  if (directHref !== null) {
    return directHref;
  }

  const projectEvidence = evidence.find(
    (item) =>
      item.evidenceType === 'operationalEntity' &&
      item.reference.entityType === 'Project',
  );

  if (
    projectEvidence !== undefined &&
    projectEvidence.evidenceType === 'operationalEntity'
  ) {
    return getRecommendationEntityHref(projectEvidence.reference);
  }

  return null;
}

export function getActionProposalTargetHref(
  item: ActionProposalListItem,
): string | null {
  const directHref = getRecommendationEntityHref(item.source.targetEntity);
  if (directHref !== null) {
    return directHref;
  }

  return getActionProposalEvidenceHref(item.source.evidence, item.source.targetEntity);
}

export function getActionProposalRecommendationHref(recommendationId: string): string {
  return `${routes.recommendations}#${encodeURIComponent(recommendationId)}`;
}

export function getActionProposalAnchor(proposal: ActionProposal): string {
  return encodeURIComponent(proposal.recommendationId);
}

export function getActionProposalInspectionHref(recommendationId: string): string {
  return `${routes.actionProposals}#${encodeURIComponent(recommendationId)}`;
}
