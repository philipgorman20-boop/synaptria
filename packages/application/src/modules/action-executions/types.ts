import type { ActionExecutionRequest } from '@synaptria/domain/action-executions';
import type { ActionProposal } from '@synaptria/domain/action-proposals';

export interface CreateActionExecutionRequestResult {
  readonly request: ActionExecutionRequest;
  readonly changed: boolean;
}

export interface ConfirmActionExecutionRequestResult {
  readonly request: ActionExecutionRequest;
  readonly changed: boolean;
}

export function buildExecutionRequestSnapshot(proposal: ActionProposal) {
  return {
    actionProposalId: proposal.id,
    recommendationId: proposal.recommendationId,
    actionType: proposal.actionType,
    target: proposal.target,
    proposedChanges: proposal.proposedChanges.map((change) => ({
      field: change.field,
      currentValue: change.currentValue,
      proposedValue: change.proposedValue,
    })),
    preconditions: proposal.preconditions.map((precondition) => ({
      field: precondition.field,
      expectedValue: precondition.expectedValue,
    })),
  };
}
