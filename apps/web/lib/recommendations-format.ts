import { programRoute, projectRoute } from '@synaptria/config';
import type { RecommendationReviewItem, RecommendationType } from '@synaptria/application';
import type { EntityReference } from '@synaptria/domain/context';

import { formatMissionControlSeverity } from '../app/dashboard/mission-control-format';

export const RECOMMENDATIONS_ROUTE = '/recommendations';

export const RECOMMENDATION_REVIEW_EYEBROW = 'RECOMMENDATIONS';
export const RECOMMENDATION_REVIEW_TITLE = 'Recommendation Review';
export const RECOMMENDATION_REVIEW_SUBTITLE =
  'Review deterministic operational recommendations and record explicit accept or dismiss decisions. No actions are executed from this surface.';

export function formatRecommendationType(type: RecommendationType): string {
  switch (type) {
    case 'resolve_blocked_critical_task':
      return 'Blocked task';
    case 'escalate_overdue_milestone':
      return 'Overdue milestone';
    case 'rebalance_near_term_workload':
      return 'Near-term workload';
    case 'review_concentrated_execution_risk':
      return 'Execution risk';
    default:
      return type;
  }
}

export function formatRecommendationReviewStatus(
  status: RecommendationReviewItem['review']['status'],
): string {
  switch (status) {
    case 'pending':
      return 'Pending review';
    case 'accepted':
      return 'Accepted';
    case 'dismissed':
      return 'Dismissed';
    default:
      return status;
  }
}

export function formatRecommendationConfidence(
  confidence: RecommendationReviewItem['recommendation']['confidence'],
): string {
  return confidence.charAt(0).toUpperCase() + confidence.slice(1);
}

export function formatEntityReferenceLabel(reference: EntityReference): string {
  return `${reference.entityType} ${reference.entityId}`;
}

export function getRecommendationEntityHref(reference: EntityReference): string | null {
  switch (reference.entityType) {
    case 'Program':
      return programRoute(reference.entityId);
    case 'Project':
      return projectRoute(reference.entityId);
    default:
      return null;
  }
}

export function getRecommendationEvidenceHref(
  item: RecommendationReviewItem,
  reference: EntityReference,
): string | null {
  const directHref = getRecommendationEntityHref(reference);
  if (directHref !== null) {
    return directHref;
  }

  if (reference.entityType === 'Project') {
    return projectRoute(reference.entityId);
  }

  const projectEvidence = item.recommendation.evidence.find(
    (evidence) =>
      evidence.evidenceType === 'operationalEntity' &&
      evidence.reference.entityType === 'Project',
  );

  if (
    projectEvidence !== undefined &&
    projectEvidence.evidenceType === 'operationalEntity'
  ) {
    return projectRoute(projectEvidence.reference.entityId);
  }

  return null;
}

export function formatRecommendationPriority(
  priority: RecommendationReviewItem['recommendation']['priority'],
): string {
  return formatMissionControlSeverity(priority);
}

export function countReviewablePendingItems(items: readonly RecommendationReviewItem[]): number {
  return items.filter((item) => item.review.status === 'pending').length;
}
