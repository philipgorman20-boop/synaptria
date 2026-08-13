import { escalateOverdueMilestoneRule } from './escalate-overdue-milestone.rule';
import { rebalanceNearTermWorkloadRule } from './rebalance-near-term-workload.rule';
import { resolveBlockedCriticalTaskRule } from './resolve-blocked-critical-task.rule';
import { reviewConcentratedExecutionRiskRule } from './review-concentrated-execution-risk.rule';
import type { RecommendationRule } from './types';

export const RECOMMENDATION_RULES: readonly RecommendationRule[] = [
  resolveBlockedCriticalTaskRule,
  escalateOverdueMilestoneRule,
  reviewConcentratedExecutionRiskRule,
  rebalanceNearTermWorkloadRule,
];
