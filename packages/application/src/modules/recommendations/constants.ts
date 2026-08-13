import type { MissionControlSeverity } from '../mission-control/constants';

/** Minimum combined due-soon milestones and tasks to suggest workload rebalancing. */
export const RECOMMENDATION_NEAR_TERM_WORKLOAD_MIN_DUE_SOON_ITEMS = 3;

/** Minimum overdue/blocked execution signals to suggest concentrated project risk review. */
export const RECOMMENDATION_CONCENTRATED_RISK_MIN_EXECUTION_SIGNALS = 2;

export const RECOMMENDATION_TYPES = [
  'resolve_blocked_critical_task',
  'escalate_overdue_milestone',
  'rebalance_near_term_workload',
  'review_concentrated_execution_risk',
] as const;

export type RecommendationType = (typeof RECOMMENDATION_TYPES)[number];

export const RECOMMENDATION_RULE_IDS = [
  'recommendations.resolve-blocked-critical-task.v0',
  'recommendations.escalate-overdue-milestone.v0',
  'recommendations.rebalance-near-term-workload.v0',
  'recommendations.review-concentrated-execution-risk.v0',
] as const;

export type RecommendationRuleId = (typeof RECOMMENDATION_RULE_IDS)[number];

export const RECOMMENDATION_STATUSES = ['proposed'] as const;

export type RecommendationStatus = (typeof RECOMMENDATION_STATUSES)[number];

export const RECOMMENDATION_CONFIDENCE_LEVELS = ['high', 'medium', 'low'] as const;

export type RecommendationConfidence = (typeof RECOMMENDATION_CONFIDENCE_LEVELS)[number];

export const RECOMMENDATION_PRIORITY_ORDER: readonly MissionControlSeverity[] = [
  'critical',
  'high',
  'medium',
  'low',
];

export const RECOMMENDATION_EVIDENCE_SOURCES = ['dailyBriefing'] as const;

export type RecommendationEvidenceSource = (typeof RECOMMENDATION_EVIDENCE_SOURCES)[number];
