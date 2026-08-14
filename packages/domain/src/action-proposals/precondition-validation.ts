import type {
  ActionProposal,
  ActionProposalPreconditionValidation,
  ActionProposalScalarValue,
} from './models';

export type ActionProposalCurrentState = Readonly<Record<string, ActionProposalScalarValue>>;

function compareScalarValues(
  left: ActionProposalScalarValue,
  right: ActionProposalScalarValue,
): boolean {
  return left === right;
}

export function validateActionProposalPreconditions(
  proposal: ActionProposal,
  currentState: ActionProposalCurrentState,
): ActionProposalPreconditionValidation {
  if (proposal.proposalKind === 'ADVISORY') {
    return {
      status: 'NOT_APPLICABLE',
      issues: [],
    };
  }

  const issues: string[] = [];

  for (const precondition of proposal.preconditions) {
    if (!(precondition.field in currentState)) {
      issues.push(`Missing authoritative current state for field "${precondition.field}".`);
      continue;
    }

    const currentValue = currentState[precondition.field];
    if (currentValue === undefined) {
      issues.push(`Missing authoritative current state for field "${precondition.field}".`);
      continue;
    }

    if (!compareScalarValues(currentValue, precondition.expectedValue)) {
      issues.push(
        `Field "${precondition.field}" no longer matches the expected precondition value.`,
      );
    }
  }

  const sortedIssues = [...issues].sort((left, right) =>
    left.localeCompare(right, 'en', { sensitivity: 'base' }),
  );

  return {
    status: sortedIssues.length === 0 ? 'CURRENT' : 'STALE',
    issues: sortedIssues,
  };
}
