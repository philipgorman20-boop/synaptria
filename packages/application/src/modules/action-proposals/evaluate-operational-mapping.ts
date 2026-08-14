import type { Recommendation } from '../recommendations/types';

export interface OperationalMappingEvaluation {
  readonly eligible: boolean;
  readonly reason: string;
}

function hasTaskPriorityMutation(recommendation: Recommendation): boolean {
  return (
    recommendation.proposedMutation !== undefined &&
    recommendation.proposedMutation.entityType === 'Task' &&
    recommendation.proposedMutation.field === 'priority'
  );
}

export function evaluateOperationalMapping(
  recommendation: Recommendation,
): OperationalMappingEvaluation {
  switch (recommendation.type) {
    case 'escalate_blocked_overdue_task_priority':
      if (hasTaskPriorityMutation(recommendation)) {
        return {
          eligible: true,
          reason:
            'Recommendation includes an explicit Task.priority mutation with a bounded proposed value.',
        };
      }

      return {
        eligible: false,
        reason:
          'Operational task priority escalation requires structured Task.priority mutation metadata.',
      };
    case 'resolve_blocked_critical_task':
      return {
        eligible: false,
        reason:
          'Recommendation specifies human blocker review only; it does not include a deterministic field mutation or exact proposed value.',
      };
    case 'escalate_overdue_milestone':
      return {
        eligible: false,
        reason:
          'Recommendation specifies milestone recovery review only; it does not include a deterministic field mutation or exact proposed value.',
      };
    case 'rebalance_near_term_workload':
      return {
        eligible: false,
        reason:
          'Recommendation specifies workload rebalance review only; it does not include a deterministic field mutation or exact proposed value.',
      };
    case 'review_concentrated_execution_risk':
      return {
        eligible: false,
        reason:
          'Recommendation specifies project risk review only; it does not include a deterministic field mutation or exact proposed value.',
      };
    default:
      return {
        eligible: false,
        reason: 'Recommendation type is not eligible for operational action proposal mapping.',
      };
  }
}

export function isOperationalMappingEligible(recommendation: Recommendation): boolean {
  return evaluateOperationalMapping(recommendation).eligible;
}
