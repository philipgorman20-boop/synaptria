import type { OrganizationId } from '@synaptria/core';
import type { EntityReference, EntityType } from '@synaptria/domain/context';

export function toEntityReference(input: {
  readonly organizationId: OrganizationId;
  readonly entityType: EntityType;
  readonly entityId: string;
}): EntityReference {
  return {
    organizationId: input.organizationId,
    entityType: input.entityType,
    entityId: input.entityId,
  };
}

export function aggregateTypeForEntityType(entityType: EntityType): string {
  switch (entityType) {
    case 'Organization':
      return 'Organization';
    case 'Program':
      return 'Program';
    case 'Project':
      return 'Project';
    case 'Milestone':
      return 'Milestone';
    case 'Task':
      return 'Task';
  }
}
