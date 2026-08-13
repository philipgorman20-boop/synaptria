import type { ContextCapabilityDefinition } from './types';

export const MILESTONE_INTELLIGENCE_V0_CAPABILITY_ID = 'milestone.intelligence.v0';

/** Milestone intelligence v0: primary Milestone, related Tasks, aggregate-scoped events. */
export const MILESTONE_INTELLIGENCE_V0: ContextCapabilityDefinition = {
  capabilityId: MILESTONE_INTELLIGENCE_V0_CAPABILITY_ID,
  capabilityVersion: 0,
  primaryEntityType: 'Milestone',
  requiredSections: [
    'identity',
    'authorization',
    'primaryEntity',
    'provenance',
    'metadata',
  ],
  optionalSections: ['relatedEntities', 'events', 'organizationalMemory'],
  includeDescendants: ['Task'],
  eventLookbackPerAggregate: 25,
  maxContributions: 100,
};
