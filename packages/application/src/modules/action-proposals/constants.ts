import type { RecommendationType } from '../recommendations/constants';

export const ACTION_PROPOSAL_ACTION_TYPES = [
  'REQUEST_TASK_BLOCKER_REVIEW',
  'REQUEST_MILESTONE_RECOVERY_REVIEW',
  'REQUEST_WORKLOAD_REBALANCE_REVIEW',
  'REQUEST_PROJECT_RISK_REVIEW',
] as const;

export type ActionProposalActionType = (typeof ACTION_PROPOSAL_ACTION_TYPES)[number];

export const RECOMMENDATION_TYPE_TO_ACTION_PROPOSAL_ACTION_TYPE = {
  resolve_blocked_critical_task: 'REQUEST_TASK_BLOCKER_REVIEW',
  escalate_overdue_milestone: 'REQUEST_MILESTONE_RECOVERY_REVIEW',
  rebalance_near_term_workload: 'REQUEST_WORKLOAD_REBALANCE_REVIEW',
  review_concentrated_execution_risk: 'REQUEST_PROJECT_RISK_REVIEW',
} as const satisfies Record<RecommendationType, ActionProposalActionType>;
