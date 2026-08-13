export function compareByNameThenId<T extends { readonly name: string; readonly id: string }>(
  left: T,
  right: T,
): number {
  const byName = left.name.localeCompare(right.name, 'en', { sensitivity: 'base' });
  if (byName !== 0) {
    return byName;
  }

  return left.id.localeCompare(right.id, 'en', { sensitivity: 'base' });
}

export function compareEntityReferences(
  left: { readonly entityType: string; readonly entityId: string },
  right: { readonly entityType: string; readonly entityId: string },
): number {
  const byType = left.entityType.localeCompare(right.entityType, 'en', { sensitivity: 'base' });
  if (byType !== 0) {
    return byType;
  }

  return left.entityId.localeCompare(right.entityId, 'en', { sensitivity: 'base' });
}

export function compareEventsByOccurredAtDescThenId(
  left: { readonly occurredAt: Date; readonly id: string },
  right: { readonly occurredAt: Date; readonly id: string },
): number {
  const byOccurredAt = right.occurredAt.getTime() - left.occurredAt.getTime();
  if (byOccurredAt !== 0) {
    return byOccurredAt;
  }

  return left.id.localeCompare(right.id, 'en', { sensitivity: 'base' });
}
