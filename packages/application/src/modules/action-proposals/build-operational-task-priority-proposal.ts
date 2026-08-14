import { taskId } from '@synaptria/core';
import type { ActionProposal } from '@synaptria/domain/action-proposals';
import type { ActionProposalScalarValue } from '@synaptria/domain/action-proposals';

import type { Recommendation } from '../recommendations/types';
import { buildOperationalActionProposal } from './build-operational-action-proposal';
import type { BuildActionProposalFromRecommendationContext } from './build-action-proposal-from-recommendation';
import { ESCALATE_BLOCKED_OVERDUE_TASK_PRIORITY_ACTION_TYPE } from './constants';

function asScalarValue(value: ActionProposalScalarValue): ActionProposalScalarValue {
  return value;
}

export async function buildOperationalTaskPriorityProposalFromRecommendation(
  recommendation: Recommendation,
  context: BuildActionProposalFromRecommendationContext,
): Promise<ActionProposal | null> {
  const mutation = recommendation.proposedMutation;
  if (mutation === undefined) {
    return null;
  }

  if (
    recommendation.type !== 'escalate_blocked_overdue_task_priority' ||
    mutation.entityType !== 'Task' ||
    mutation.field !== 'priority'
  ) {
    return null;
  }

  if (recommendation.targetEntity.entityType !== 'Task') {
    return null;
  }

  const taskState = await context.stateReaders.tasks.findById(
    context.organizationId,
    taskId(recommendation.targetEntity.entityId),
  );

  if (taskState === null || taskState.organizationId !== context.organizationId) {
    return null;
  }

  const currentPriority = asScalarValue(taskState.priority);
  const proposedPriority = asScalarValue(mutation.proposedValue);

  if (currentPriority === proposedPriority) {
    return null;
  }

  return buildOperationalActionProposal({
    recommendation,
    actionType: ESCALATE_BLOCKED_OVERDUE_TASK_PRIORITY_ACTION_TYPE,
    title: `Operational change: ${recommendation.title}`,
    description: recommendation.proposedAction.description,
    proposedChanges: [
      {
        field: 'priority',
        currentValue: currentPriority,
        proposedValue: proposedPriority,
      },
    ],
    preconditions: [
      {
        field: 'priority',
        expectedValue: currentPriority,
      },
      {
        field: 'updatedAt',
        expectedValue: asScalarValue(taskState.updatedAt),
      },
    ],
  });
}
