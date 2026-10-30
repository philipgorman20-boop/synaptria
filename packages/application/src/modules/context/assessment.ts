import type {
  ConfidenceAssessment,
  ConfidenceFactor,
  ContextContribution,
  ContextCompleteness,
  ContextSectionId,
} from '@synaptria/domain/context';

import type { ContextCapabilityDefinition } from './capabilities/types';

export interface ConfidenceAssessmentInput {
  readonly capability: ContextCapabilityDefinition;
  readonly relatedEntities: readonly ContextContribution[];
  readonly events: readonly ContextContribution[];
  readonly organizationalMemory: readonly ContextContribution[];
  readonly relatedEntitiesPermissionRestricted: boolean;
  readonly relatedEntitiesExpected: boolean;
  readonly organizationalMemoryRequested: boolean;
  readonly organizationalMemoryUnavailable: boolean;
  readonly relatedEntitiesTruncated: boolean;
}

export function assessConfidence(input: ConfidenceAssessmentInput): ConfidenceAssessment {
  const factors: ConfidenceFactor[] = [
    {
      code: 'primaryEntityResolved',
      impact: 'increase',
      message: 'Primary entity was resolved successfully.',
    },
  ];

  let level: ConfidenceAssessment['level'] = 'high';

  if (input.relatedEntitiesExpected) {
    if (input.relatedEntitiesPermissionRestricted) {
      factors.push({
        code: 'permissionRestrictedSlice',
        impact: 'decrease',
        message: 'Some related entities were omitted due to read permissions.',
      });
      level = 'medium';
    } else if (input.relatedEntitiesTruncated) {
      factors.push({
        code: 'relatedEntitiesPartial',
        impact: 'decrease',
        message: 'Related entities were truncated to respect the contribution budget.',
      });
      level = 'medium';
    } else if (input.relatedEntities.length > 0) {
      factors.push({
        code: 'relatedEntitiesComplete',
        impact: 'increase',
        message: 'Related entities were loaded for the primary entity.',
      });
    } else {
      factors.push({
        code: 'relatedEntitiesPartial',
        impact: 'neutral',
        message: 'No related entities were available for the primary entity.',
      });
    }
  }

  if (input.events.length > 0) {
    factors.push({
      code: 'eventsIncluded',
      impact: 'increase',
      message: 'Aggregate-scoped events were included in the context package.',
    });
  }

  if (input.organizationalMemoryRequested) {
    if (input.organizationalMemoryUnavailable) {
      factors.push({
        code: 'organizationalMemoryUnavailable',
        impact: 'decrease',
        message: 'Organizational Memory retrieval is unavailable.',
      });
      if (level === 'high') {
        level = 'medium';
      }
    } else if (input.organizationalMemory.length === 0) {
      factors.push({
        code: 'organizationalMemoryEmpty',
        impact: 'neutral',
        message: 'Organizational Memory returned no curated entries.',
      });
      if (level === 'high') {
        level = 'medium';
      }
    }
  }

  return {
    level,
    factors,
    explanation: buildConfidenceExplanation(level, factors),
  };
}

function buildConfidenceExplanation(
  level: ConfidenceAssessment['level'],
  factors: readonly ConfidenceFactor[],
): string {
  const factorSummary = factors.map((factor) => factor.code).join(', ');
  return `Deterministic confidence level "${level}" based on: ${factorSummary}.`;
}

export interface CompletenessAssessmentInput {
  readonly capability: ContextCapabilityDefinition;
  readonly requestedSections: readonly ContextSectionId[];
  readonly relatedEntities: readonly ContextContribution[];
  readonly events: readonly ContextContribution[];
  readonly organizationalMemory: readonly ContextContribution[];
  readonly relatedEntitiesPermissionRestricted: boolean;
  readonly providerFailures: readonly string[];
  readonly organizationalMemoryUnavailable: boolean;
  readonly truncatedContributionCount: number;
}

export function assessCompleteness(
  input: CompletenessAssessmentInput,
): ContextCompleteness {
  const missingSections: ContextSectionId[] = [];
  const degradationNotes: string[] = [...input.providerFailures];

  if (
    input.requestedSections.includes('relatedEntities') &&
    input.relatedEntitiesPermissionRestricted
  ) {
    degradationNotes.push(
      'Related entities were degraded because read permission was missing.',
    );
  }

  if (
    input.requestedSections.includes('organizationalMemory') &&
    input.organizationalMemoryUnavailable
  ) {
    degradationNotes.push('Organizational Memory is unavailable.');
  } else if (
    input.requestedSections.includes('organizationalMemory') &&
    input.organizationalMemory.length === 0
  ) {
    degradationNotes.push('Organizational Memory is empty.');
  }

  if (input.truncatedContributionCount > 0) {
    degradationNotes.push(
      `Context contributions were truncated to respect maxContributions (${input.truncatedContributionCount} omitted).`,
    );
  }

  for (const section of input.capability.requiredSections) {
    if (!input.requestedSections.includes(section)) {
      missingSections.push(section);
    }
  }

  const status =
    missingSections.length > 0
      ? 'insufficient'
      : degradationNotes.length > 0
        ? 'degraded'
        : 'complete';

  return {
    status,
    missingSections,
    degradationNotes,
  };
}
