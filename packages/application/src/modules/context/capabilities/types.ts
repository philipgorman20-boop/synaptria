import type { ContextSectionId, EntityType } from '@synaptria/domain/context';

export interface ContextCapabilityDefinition {
  readonly capabilityId: string;
  readonly capabilityVersion: number;
  readonly primaryEntityType: EntityType;
  readonly requiredSections: readonly ContextSectionId[];
  readonly optionalSections: readonly ContextSectionId[];
  readonly includeDescendants: readonly EntityType[];
  readonly eventLookbackPerAggregate: number;
  readonly maxContributions: number;
}
