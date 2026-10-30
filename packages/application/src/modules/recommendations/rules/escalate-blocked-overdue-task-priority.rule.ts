import { toEntityReference } from '../../context/mappers/entity-reference';
import type { DailyBriefingProjectHighlight } from '../../daily-briefing/types';
import type { RecommendationRuleId } from '../constants';
import { resolveTaskPriorityEscalationTarget } from '../resolve-task-priority-escalation';
import {
  canEvaluateProjectRecommendations,
  canEvaluateTaskRecommendations,
} from '../restricted-slices';
import type { RecommendationRule, RecommendationRuleCandidate, RecommendationRuleContext } from './types';

const RULE_ID =
  'recommendations.escalate-blocked-overdue-task-priority.v0' as RecommendationRuleId;

function findProjectHighlight(
  snapshot: RecommendationRuleContext['snapshot'],
  projectId: string,
): DailyBriefingProjectHighlight | undefined {
  return snapshot.projectHighlights.find((project) => project.projectId === projectId);
}

export const escalateBlockedOverdueTaskPriorityRule: RecommendationRule = {
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

    for (const task of snapshot.taskSignals) {
      if (!task.blocked || !task.overdue) {
        continue;
      }

      if (task.projectId.length === 0) {
        continue;
      }

      const project = findProjectHighlight(snapshot, task.projectId);
      if (project === undefined || project.healthState !== 'at_risk') {
        continue;
      }

      const proposedPriority = resolveTaskPriorityEscalationTarget(task.priority);
      if (proposedPriority === null) {
        continue;
      }

      const taskReference = toEntityReference({
        organizationId,
        entityType: 'Task',
        entityId: task.taskId,
      });
      const projectReference = toEntityReference({
        organizationId,
        entityType: 'Project',
        entityId: project.projectId,
      });

      candidates.push({
        ruleId: RULE_ID,
        type: 'escalate_blocked_overdue_task_priority',
        title: `Escalate priority for blocked overdue task ${task.taskName}`,
        rationale:
          `Task "${task.taskName}" is blocked and overdue on at-risk project "${project.projectName}". ` +
          `Current priority is ${task.priority}; deterministic escalation proposes ${proposedPriority}.`,
        priority: 'high',
        targetEntity: taskReference,
        proposedActionDescription:
          `Raise task priority from ${task.priority} to ${proposedPriority} to reflect blocked overdue execution risk.`,
        proposedMutation: {
          entityType: 'Task',
          field: 'priority',
          proposedValue: proposedPriority,
        },
        evidenceEntities: [taskReference, projectReference],
        corroboratingSignalCount: 3,
      });
    }

    return candidates;
  },
};
