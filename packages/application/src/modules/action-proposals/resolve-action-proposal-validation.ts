import type { OrganizationId } from '@synaptria/core';
import { milestoneId, projectId, taskId } from '@synaptria/core';
import type {
  ActionProposal,
  ActionProposalCurrentState,
  ActionProposalPreconditionValidation,
} from '@synaptria/domain/action-proposals';
import { validateActionProposalPreconditions } from '@synaptria/domain/action-proposals';

import type {
  MilestoneActionProposalState,
  ProjectActionProposalState,
  TaskActionProposalState,
} from './state-readers/types';
import type { ActionProposalStateReaders } from './state-readers/types';

function taskStateToCurrentState(state: TaskActionProposalState): ActionProposalCurrentState {
  return {
    status: state.status,
    priority: state.priority,
    plannedEndDate: state.plannedEndDate,
    updatedAt: state.updatedAt,
  };
}

function milestoneStateToCurrentState(
  state: MilestoneActionProposalState,
): ActionProposalCurrentState {
  return {
    status: state.status,
    priority: state.priority,
    plannedEndDate: state.plannedEndDate,
    updatedAt: state.updatedAt,
  };
}

function projectStateToCurrentState(
  state: ProjectActionProposalState,
): ActionProposalCurrentState {
  return {
    status: state.status,
    priority: state.priority,
    targetEndDate: state.targetEndDate,
    updatedAt: state.updatedAt,
  };
}

export async function loadAuthoritativeCurrentState(
  proposal: ActionProposal,
  organizationId: OrganizationId,
  stateReaders: ActionProposalStateReaders,
): Promise<ActionProposalCurrentState | null> {
  switch (proposal.target.entityType) {
    case 'Task': {
      const state = await stateReaders.tasks.findById(
        organizationId,
        taskId(proposal.target.entityId),
      );
      return state === null ? null : taskStateToCurrentState(state);
    }
    case 'Milestone': {
      const state = await stateReaders.milestones.findById(
        organizationId,
        milestoneId(proposal.target.entityId),
      );
      return state === null ? null : milestoneStateToCurrentState(state);
    }
    case 'Project': {
      const state = await stateReaders.projects.findById(
        organizationId,
        projectId(proposal.target.entityId),
      );
      return state === null ? null : projectStateToCurrentState(state);
    }
    default:
      return null;
  }
}

export async function resolveActionProposalValidation(
  proposal: ActionProposal,
  organizationId: OrganizationId,
  stateReaders: ActionProposalStateReaders,
): Promise<ActionProposalPreconditionValidation> {
  if (proposal.proposalKind === 'ADVISORY') {
    return {
      status: 'NOT_APPLICABLE',
      issues: [],
    };
  }

  const currentState = await loadAuthoritativeCurrentState(
    proposal,
    organizationId,
    stateReaders,
  );

  if (currentState === null) {
    return {
      status: 'STALE',
      issues: ['Authoritative target state is unavailable for precondition validation.'],
    };
  }

  return validateActionProposalPreconditions(proposal, currentState);
}

export function resolveActionProposalValidationFromCurrentState(
  proposal: ActionProposal,
  currentState: ActionProposalCurrentState | null,
): ActionProposalPreconditionValidation {
  if (proposal.proposalKind === 'ADVISORY') {
    return {
      status: 'NOT_APPLICABLE',
      issues: [],
    };
  }

  if (currentState === null) {
    return {
      status: 'STALE',
      issues: ['Authoritative target state is unavailable for precondition validation.'],
    };
  }

  return validateActionProposalPreconditions(proposal, currentState);
}
