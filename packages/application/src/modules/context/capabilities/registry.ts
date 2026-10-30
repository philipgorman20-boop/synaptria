import { MILESTONE_INTELLIGENCE_V0, MILESTONE_INTELLIGENCE_V0_CAPABILITY_ID } from './milestone-intelligence-v0';
import { PROJECT_INTELLIGENCE_V0, PROJECT_INTELLIGENCE_V0_CAPABILITY_ID } from './project-intelligence-v0';
import type { ContextCapabilityDefinition } from './types';

export { MILESTONE_INTELLIGENCE_V0_CAPABILITY_ID, PROJECT_INTELLIGENCE_V0_CAPABILITY_ID };

export const CONTEXT_CAPABILITY_REGISTRY: Readonly<
  Record<string, ContextCapabilityDefinition>
> = Object.freeze({
  [PROJECT_INTELLIGENCE_V0_CAPABILITY_ID]: PROJECT_INTELLIGENCE_V0,
  [MILESTONE_INTELLIGENCE_V0_CAPABILITY_ID]: MILESTONE_INTELLIGENCE_V0,
});

export function resolveCapabilityDefinition(
  capabilityId: string,
): ContextCapabilityDefinition | null {
  return CONTEXT_CAPABILITY_REGISTRY[capabilityId] ?? null;
}
