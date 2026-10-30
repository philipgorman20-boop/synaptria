import type { OrganizationId } from '@synaptria/core';
import type { ActionProposalCurrentState } from '@synaptria/domain/action-proposals';
import { validateActionProposalPreconditions } from '@synaptria/domain/action-proposals';

import type {
  ActionExecutionReadinessResult,
  ActionExecutionRequest,
} from './models';

export interface ValidateExecutionRequestReadinessInput {
  readonly request: ActionExecutionRequest;
  readonly organizationId: OrganizationId;
  readonly currentState: ActionProposalCurrentState | null;
  readonly supportedActionTypes: readonly string[];
  readonly requireConfirmed?: boolean;
}

function unsupported(issues: readonly string[]): ActionExecutionReadinessResult {
  return {
    status: 'UNSUPPORTED',
    issues: [...issues].sort((left, right) =>
      left.localeCompare(right, 'en', { sensitivity: 'base' }),
    ),
  };
}

/** Pure readiness check; does not mutate operational state. */
export function validateExecutionRequestReadiness(
  input: ValidateExecutionRequestReadinessInput,
): ActionExecutionReadinessResult {
  const { request, organizationId, currentState, supportedActionTypes, requireConfirmed } =
    input;

  if (request.organizationId !== organizationId) {
    return unsupported(['Execution request organization does not match trusted context.']);
  }

  if (request.snapshot.proposedChanges.length === 0) {
    return unsupported(['Execution request snapshot must include bounded proposed changes.']);
  }

  if (request.snapshot.preconditions.length === 0) {
    return unsupported(['Execution request snapshot must include bounded preconditions.']);
  }

  if (!supportedActionTypes.includes(request.snapshot.actionType)) {
    return unsupported([
      `Action type "${request.snapshot.actionType}" is not supported by the execution contract.`,
    ]);
  }

  if (requireConfirmed === true && request.status !== 'CONFIRMED') {
    return unsupported(['Execution request requires explicit human confirmation.']);
  }

  if (currentState === null) {
    return {
      status: 'STALE',
      issues: ['Authoritative target state is unavailable for precondition revalidation.'],
    };
  }

  const preconditionValidation = validateActionProposalPreconditions(
    {
      id: request.snapshot.actionProposalId,
      organizationId: request.organizationId,
      recommendationId: request.snapshot.recommendationId,
      recommendationType: '',
      actionType: request.snapshot.actionType,
      proposalKind: 'OPERATIONAL',
      target: request.snapshot.target,
      title: '',
      description: '',
      proposedChanges: request.snapshot.proposedChanges,
      preconditions: request.snapshot.preconditions,
      evidenceKeys: [],
      status: 'PROPOSED',
      createdAt: request.requestedAt,
    },
    currentState,
  );

  if (preconditionValidation.status === 'STALE') {
    return {
      status: 'STALE',
      issues: preconditionValidation.issues,
    };
  }

  return {
    status: 'READY',
    issues: [],
  };
}
