import type {
  ActionProposal,
  ActionProposalChange,
  ActionProposalPrecondition,
  ActionProposalScalarValue,
} from './models';

export function isActionProposalScalarValue(
  value: unknown,
): value is ActionProposalScalarValue {
  return (
    value === null ||
    typeof value === 'string' ||
    typeof value === 'number' ||
    typeof value === 'boolean'
  );
}

function compareScalarValues(
  left: ActionProposalScalarValue,
  right: ActionProposalScalarValue,
): boolean {
  return left === right;
}

function findPreconditionForField(
  preconditions: readonly ActionProposalPrecondition[],
  field: string,
): ActionProposalPrecondition | undefined {
  return preconditions.find((precondition) => precondition.field === field);
}

function validateChangeScalars(change: ActionProposalChange): readonly string[] {
  const issues: string[] = [];

  if (!isActionProposalScalarValue(change.currentValue)) {
    issues.push(`Change field "${change.field}" has a non-scalar current value.`);
  }

  if (!isActionProposalScalarValue(change.proposedValue)) {
    issues.push(`Change field "${change.field}" has a non-scalar proposed value.`);
  }

  return issues;
}

export function validateActionProposalInvariants(
  proposal: ActionProposal,
  options?: {
    readonly mutableFields?: ReadonlySet<string>;
    readonly preconditionFields?: ReadonlySet<string>;
  },
): readonly string[] {
  const issues: string[] = [];
  const mutableFields = options?.mutableFields;
  const preconditionFields = options?.preconditionFields;

  if (proposal.status !== 'PROPOSED') {
    issues.push('Action proposals must remain in PROPOSED status.');
  }

  if (proposal.proposalKind === 'ADVISORY') {
    if (proposal.proposedChanges.length > 0) {
      issues.push('Advisory proposals must not include proposedChanges.');
    }

    if (proposal.preconditions.length > 0) {
      issues.push('Advisory proposals must not include preconditions.');
    }
  }

  if (proposal.proposalKind === 'OPERATIONAL') {
    if (proposal.proposedChanges.length === 0) {
      issues.push('Operational proposals must include at least one proposed change.');
    }

    if (proposal.preconditions.length === 0) {
      issues.push('Operational proposals must include at least one precondition.');
    }

    const changeFields = new Set<string>();
    for (const change of proposal.proposedChanges) {
      issues.push(...validateChangeScalars(change));

      if (changeFields.has(change.field)) {
        issues.push(`Duplicate proposed change field "${change.field}".`);
      }
      changeFields.add(change.field);

      if (mutableFields !== undefined && !mutableFields.has(change.field)) {
        issues.push(`Proposed change field "${change.field}" is not allowlisted.`);
      }

      const matchingPrecondition = findPreconditionForField(
        proposal.preconditions,
        change.field,
      );

      if (matchingPrecondition === undefined) {
        issues.push(`Proposed change field "${change.field}" is missing a matching precondition.`);
      } else if (
        !compareScalarValues(change.currentValue, matchingPrecondition.expectedValue)
      ) {
        issues.push(
          `Proposed change field "${change.field}" currentValue must match its precondition expectedValue.`,
        );
      }

      if (compareScalarValues(change.currentValue, change.proposedValue)) {
        issues.push(
          `Proposed change field "${change.field}" must differ between currentValue and proposedValue.`,
        );
      }
    }

    const preconditionFields = new Set<string>();
    for (const precondition of proposal.preconditions) {
      if (!isActionProposalScalarValue(precondition.expectedValue)) {
        issues.push(`Precondition field "${precondition.field}" has a non-scalar expected value.`);
      }

      if (preconditionFields.has(precondition.field)) {
        issues.push(`Duplicate precondition field "${precondition.field}".`);
      }
      preconditionFields.add(precondition.field);

      if (preconditionFields !== undefined && !preconditionFields.has(precondition.field)) {
        issues.push(`Precondition field "${precondition.field}" is not allowlisted.`);
      }
    }
  }

  return [...issues].sort((left, right) =>
    left.localeCompare(right, 'en', { sensitivity: 'base' }),
  );
}

export function isValidActionProposal(
  proposal: ActionProposal,
  options?: {
    readonly mutableFields?: ReadonlySet<string>;
    readonly preconditionFields?: ReadonlySet<string>;
  },
): boolean {
  return validateActionProposalInvariants(proposal, options).length === 0;
}
