import type { ContextContribution } from '@synaptria/domain/context';

/**
 * Enforces ContextScope.maxContributions across assembled contributions.
 *
 * Budget counts every ContextContribution in the package:
 * - primaryEntity (always retained; consumes one slot)
 * - relatedEntities
 * - events
 * - organizationalMemory
 *
 * Optional sections are truncated in priority order after deterministic sorting:
 * relatedEntities, then events, then organizationalMemory.
 */
export interface ContributionBudgetEnforcementResult {
  readonly relatedEntities: readonly ContextContribution[];
  readonly events: readonly ContextContribution[];
  readonly organizationalMemory: readonly ContextContribution[];
  readonly truncatedContributionCount: number;
  readonly relatedEntitiesTruncated: boolean;
  readonly eventsTruncated: boolean;
  readonly organizationalMemoryTruncated: boolean;
}

export function enforceContributionBudget(input: {
  readonly maxContributions: number;
  readonly relatedEntities: readonly ContextContribution[];
  readonly events: readonly ContextContribution[];
  readonly organizationalMemory: readonly ContextContribution[];
}): ContributionBudgetEnforcementResult {
  const optionalBudget = Math.max(0, input.maxContributions - 1);

  const relatedEntities = input.relatedEntities.slice(0, optionalBudget);
  let remainingBudget = optionalBudget - relatedEntities.length;

  const events = input.events.slice(0, remainingBudget);
  remainingBudget -= events.length;

  const organizationalMemory = input.organizationalMemory.slice(0, remainingBudget);

  const relatedEntitiesTruncated = relatedEntities.length < input.relatedEntities.length;
  const eventsTruncated = events.length < input.events.length;
  const organizationalMemoryTruncated =
    organizationalMemory.length < input.organizationalMemory.length;

  return {
    relatedEntities,
    events,
    organizationalMemory,
    truncatedContributionCount:
      input.relatedEntities.length -
      relatedEntities.length +
      (input.events.length - events.length) +
      (input.organizationalMemory.length - organizationalMemory.length),
    relatedEntitiesTruncated,
    eventsTruncated,
    organizationalMemoryTruncated,
  };
}
