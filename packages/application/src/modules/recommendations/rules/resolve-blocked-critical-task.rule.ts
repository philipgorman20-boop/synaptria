import { toEntityReference } from '../../context/mappers/entity-reference';
import type { DailyBriefingProjectHighlight } from '../../daily-briefing/types';
import type { RecommendationRuleId } from '../constants';
import {
  canEvaluateProjectRecommendations,
  canEvaluateTaskRecommendations,
} from '../restricted-slices';
import type { RecommendationRule, RecommendationRuleCandidate, RecommendationRuleContext } from './types';

const RULE_ID = 'recommendations.resolve-blocked-critical-task.v0' as RecommendationRuleId;

function findProjectHighlight(
  snapshot: RecommendationRuleContext['snapshot'],
  projectId: string,
): DailyBriefingProjectHighlight | undefined {
  return snapshot.projectHighlights.find((project) => project.projectId === projectId);
}

export const resolveBlockedCriticalTaskRule: RecommendationRule = {
  ruleId: RULE_ID,
  evaluate(context): readonly RecommendationRuleCandidate[] {
    const { snapshot, organizationId } = context;
    const restrictedSlices = snapshot.metadata.restrictedSlices;

    if (
      !canEvaluateTaskRecommendations(restrictedSlices) ||
      !canEvaluateProjectRecommendations(restrictedSlices)
    ) {
      return [];
    }

    const candidates: RecommendationRuleCandidate[] = [];

    for (const item of snapshot.attentionItems) {
      if (item.type !== 'blocked_task') {
        continue;
      }

      const projectId = item.projectId;
      if (projectId === undefined) {
        continue;
      }

      const project = findProjectHighlight(snapshot, projectId);
      if (project === undefined || project.healthState !== 'at_risk') {
        continue;
      }

      const taskReference = toEntityReference({
        organizationId,
        entityType: 'Task',
        entityId: item.entity.entityId,
      });
      const projectReference = toEntityReference({
        organizationId,
        entityType: 'Project',
        entityId: project.projectId,
      });

      const corroboratingSignalCount =
        1 +
        (project.overdueTasks > 0 ? 1 : 0) +
        (project.blockedTasks > 1 ? 1 : 0) +
        (project.overdueMilestones > 0 ? 1 : 0);

      candidates.push({
        ruleId: RULE_ID,
        type: 'resolve_blocked_critical_task',
        title: `Review blocker on ${item.title}`,
        rationale:
          `Task "${item.title}" is blocked and belongs to at-risk project "${project.projectName}" ` +
          `with ${project.blockedTasks} blocked and ${project.overdueTasks} overdue execution signals.`,
        priority: item.severity,
        targetEntity: taskReference,
        proposedActionDescription:
          'Review the blocking dependency and assign an owner for resolution.',
        evidenceEntities: [taskReference, projectReference],
        corroboratingSignalCount,
      });
    }

    return candidates;
  },
};
