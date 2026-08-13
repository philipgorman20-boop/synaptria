import type { OrganizationId } from '@synaptria/core';
import type { ContextRequest, ContextScope } from '@synaptria/domain/context';
import { validateContextScope } from '@synaptria/domain/context';

import type { ContextCapabilityDefinition } from '../capabilities/types';

export function resolveContextScope(input: {
  readonly organizationId: OrganizationId;
  readonly request: ContextRequest;
  readonly capability: ContextCapabilityDefinition;
}): ContextScope {
  return validateContextScope({
    organizationId: input.organizationId,
    primaryEntity: input.request.primaryEntity,
    includeDescendants: [...input.capability.includeDescendants],
    eventLookbackPerAggregate: input.capability.eventLookbackPerAggregate,
    maxContributions: input.capability.maxContributions,
  });
}
