import type { Clock } from '@synaptria/core';
import type {
  ContextContribution,
  ProvenanceRecord,
} from '@synaptria/domain/context';

export function createOperationalProvenance(input: {
  readonly clock: Clock;
  readonly sourceType: string;
  readonly sourceId?: string;
  readonly retrievalMethod: ProvenanceRecord['retrievalMethod'];
  readonly permissionScope: readonly string[];
}): ProvenanceRecord {
  return {
    sourceSystem: 'synaptria.operational',
    sourceType: input.sourceType,
    retrievalMethod: input.retrievalMethod,
    retrievedAt: input.clock.now(),
    permissionScope: [...input.permissionScope],
    ...(input.sourceId === undefined ? {} : { sourceId: input.sourceId }),
  };
}

export function createEventProvenance(input: {
  readonly clock: Clock;
  readonly aggregateType: string;
  readonly aggregateId: string;
  readonly permissionScope: readonly string[];
}): ProvenanceRecord {
  return {
    sourceSystem: 'synaptria.events',
    sourceType: input.aggregateType,
    sourceId: input.aggregateId,
    retrievalMethod: 'eventRepository.findByAggregate',
    retrievedAt: input.clock.now(),
    permissionScope: [...input.permissionScope],
  };
}

export function createOrganizationalMemoryProvenance(input: {
  readonly clock: Clock;
  readonly permissionScope: readonly string[];
}): ProvenanceRecord {
  return {
    sourceSystem: 'synaptria.organizationalMemory',
    sourceType: 'organizationalMemory',
    retrievalMethod: 'memoryProvider.retrieve',
    retrievedAt: input.clock.now(),
    permissionScope: [...input.permissionScope],
  };
}

export function collectProvenanceRecords(
  contributions: readonly ContextContribution[],
): readonly ProvenanceRecord[] {
  const records: ProvenanceRecord[] = [];

  for (const contribution of contributions) {
    records.push(contribution.provenance);
  }

  return records.sort(compareProvenanceRecords);
}

function compareProvenanceRecords(left: ProvenanceRecord, right: ProvenanceRecord): number {
  const bySystem = left.sourceSystem.localeCompare(right.sourceSystem);
  if (bySystem !== 0) {
    return bySystem;
  }

  const byType = left.sourceType.localeCompare(right.sourceType);
  if (byType !== 0) {
    return byType;
  }

  const leftSourceId = left.sourceId ?? '';
  const rightSourceId = right.sourceId ?? '';
  return leftSourceId.localeCompare(rightSourceId);
}
