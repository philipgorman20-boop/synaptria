import { toEntityReference } from '../../context/mappers/entity-reference';
import type { RecommendationRuleId } from '../constants';
import { canEvaluateMilestoneRecommendations } from '../restricted-slices';
import type { RecommendationRule, RecommendationRuleCandidate, RecommendationRuleContext } from './types';

const RULE_ID = 'recommendations.escalate-overdue-milestone.v0' as RecommendationRuleId;

export const escalateOverdueMilestoneRule: RecommendationRule = {
  ruleId: RULE_ID,
  evaluate(context): readonly RecommendationRuleCandidate[] {
    const { snapshot, organizationId } = context;

    if (!canEvaluateMilestoneRecommendations(snapshot.metadata.restrictedSlices)) {
      return [];
    }

    const candidates: RecommendationRuleCandidate[] = [];

    for (const item of snapshot.attentionItems) {
      if (item.type !== 'overdue_milestone') {
        continue;
      }

      if (item.severity !== 'critical' && item.severity !== 'high') {
        continue;
      }

      const milestoneReference = toEntityReference({
        organizationId,
        entityType: 'Milestone',
        entityId: item.entity.entityId,
      });

      const evidenceEntities = [milestoneReference];
      if (item.projectId !== undefined) {
        evidenceEntities.push(
          toEntityReference({
            organizationId,
            entityType: 'Project',
            entityId: item.projectId,
          }),
        );
      }

      candidates.push({
        ruleId: RULE_ID,
        type: 'escalate_overdue_milestone',
        title: `Escalate overdue milestone ${item.title}`,
        rationale: `${item.reason} Milestone attention severity is ${item.severity}.`,
        priority: item.severity,
        targetEntity: milestoneReference,
        proposedActionDescription: 'Review the milestone recovery plan and confirm recovery ownership.',
        evidenceEntities,
        corroboratingSignalCount: evidenceEntities.length,
      });
    }

    return candidates;
  },
};
