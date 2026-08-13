import { toEntityReference } from '../../context/mappers/entity-reference';
import { RECOMMENDATION_CONCENTRATED_RISK_MIN_EXECUTION_SIGNALS } from '../constants';
import type { RecommendationRuleId } from '../constants';
import { canEvaluateProjectRecommendations } from '../restricted-slices';
import type { RecommendationRule, RecommendationRuleCandidate, RecommendationRuleContext } from './types';

const RULE_ID = 'recommendations.review-concentrated-execution-risk.v0' as RecommendationRuleId;

function countExecutionRiskSignals(project: {
  readonly overdueTasks: number;
  readonly blockedTasks: number;
  readonly overdueMilestones: number;
}): number {
  return project.overdueTasks + project.blockedTasks + project.overdueMilestones;
}

export const reviewConcentratedExecutionRiskRule: RecommendationRule = {
  ruleId: RULE_ID,
  evaluate(context): readonly RecommendationRuleCandidate[] {
    const { snapshot, organizationId } = context;

    if (!canEvaluateProjectRecommendations(snapshot.metadata.restrictedSlices)) {
      return [];
    }

    const candidates: RecommendationRuleCandidate[] = [];

    for (const project of snapshot.projectHighlights) {
      const executionSignals = countExecutionRiskSignals(project);
      if (executionSignals < RECOMMENDATION_CONCENTRATED_RISK_MIN_EXECUTION_SIGNALS) {
        continue;
      }

      const projectReference = toEntityReference({
        organizationId,
        entityType: 'Project',
        entityId: project.projectId,
      });

      candidates.push({
        ruleId: RULE_ID,
        type: 'review_concentrated_execution_risk',
        title: `Review execution risk on ${project.projectName}`,
        rationale:
          `Project "${project.projectName}" has ${project.overdueTasks} overdue tasks, ` +
          `${project.blockedTasks} blocked tasks, and ${project.overdueMilestones} overdue milestones.`,
        priority: project.attentionSeverity,
        targetEntity: projectReference,
        proposedActionDescription: 'Conduct a focused project risk review with accountable owners.',
        evidenceEntities: [projectReference],
        corroboratingSignalCount: executionSignals,
      });
    }

    return candidates;
  },
};
