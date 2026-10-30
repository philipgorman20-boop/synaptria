import type { ContextCapabilityDefinition } from './types';

export const PROJECT_INTELLIGENCE_V0_CAPABILITY_ID = 'project.intelligence.v0';

/** Project intelligence v0: primary Project, related Milestones, aggregate-scoped events. */
export const PROJECT_INTELLIGENCE_V0: ContextCapabilityDefinition = {
  capabilityId: PROJECT_INTELLIGENCE_V0_CAPABILITY_ID,
  capabilityVersion: 0,
  primaryEntityType: 'Project',
  requiredSections: [
    'identity',
    'authorization',
    'primaryEntity',
    'provenance',
    'metadata',
  ],
  optionalSections: ['relatedEntities', 'events', 'organizationalMemory'],
  includeDescendants: ['Milestone'],
  eventLookbackPerAggregate: 25,
  maxContributions: 100,
};
