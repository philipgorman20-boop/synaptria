import { toEntityReference } from '../../context/mappers/entity-reference';
import { RECOMMENDATION_NEAR_TERM_WORKLOAD_MIN_DUE_SOON_ITEMS } from '../constants';
import type { RecommendationRuleId } from '../constants';
import { canEvaluateProjectRecommendations } from '../restricted-slices';
import type { RecommendationRule, RecommendationRuleCandidate, RecommendationRuleContext } from './types';

const RULE_ID = 'recommendations.rebalance-near-term-workload.v0' as RecommendationRuleId;

export const rebalanceNearTermWorkloadRule: RecommendationRule = {
  ruleId: RULE_ID,
  evaluate(context): readonly RecommendationRuleCandidate[] {
    const { snapshot, organizationId } = context;

    if (!canEvaluateProjectRecommendations(snapshot.metadata.restrictedSlices)) {
      return [];
    }

    const candidates: RecommendationRuleCandidate[] = [];

    for (const project of snapshot.projectHighlights) {
      const dueSoonCount = project.dueSoonMilestones + project.dueSoonTasks;
      if (dueSoonCount < RECOMMENDATION_NEAR_TERM_WORKLOAD_MIN_DUE_SOON_ITEMS) {
        continue;
      }

      const projectReference = toEntityReference({
        organizationId,
        entityType: 'Project',
        entityId: project.projectId,
      });

      candidates.push({
        ruleId: RULE_ID,
        type: 'rebalance_near_term_workload',
        title: `Rebalance near-term workload on ${project.projectName}`,
        rationale:
          `Project "${project.projectName}" has ${project.dueSoonMilestones} due-soon milestones and ` +
          `${project.dueSoonTasks} due-soon tasks in the current briefing window.`,
        priority: project.attentionSeverity,
        targetEntity: projectReference,
        proposedActionDescription:
          'Review near-term capacity and prioritization across upcoming milestones and tasks.',
        evidenceEntities: [projectReference],
        corroboratingSignalCount: dueSoonCount,
      });
    }

    return candidates;
  },
};
