import type {
  ContextContribution,
  ContextJsonObject,
  ContextPackage,
  ProvenanceRecord,
} from './models';
import { validateContextPackage } from './validation';

export function serializeContextPackage(input: ContextPackage): ContextJsonObject {
  const validated = validateContextPackage(input);
  return toDeterministicJsonObject(validated);
}

export function parseContextPackage(input: ContextJsonObject): ContextPackage {
  const revived = reviveContextPackageDates(input);
  return validateContextPackage(revived);
}

export function serializeContextPackageJson(input: ContextPackage): string {
  return JSON.stringify(serializeContextPackage(input));
}

function reviveContextPackageDates(input: ContextJsonObject): ContextPackage {
  const raw = input as unknown as Record<string, unknown>;

  return {
    ...(raw as unknown as ContextPackage),
    assembledAt: reviveDateField(raw.assembledAt, 'assembledAt'),
    primaryEntity: reviveContextContributionDates(raw.primaryEntity as ContextJsonObject),
    relatedEntities: reviveContextContributionListDates(raw.relatedEntities),
    events: reviveContextContributionListDates(raw.events),
    organizationalMemory: reviveContextContributionListDates(raw.organizationalMemory),
    provenance: reviveProvenanceListDates(raw.provenance),
  };
}

function reviveContextContributionListDates(value: unknown): readonly ContextContribution[] {
  if (!Array.isArray(value)) {
    throw new TypeError('Contribution list must be an array.');
  }

  return value.map((entry) => reviveContextContributionDates(entry as ContextJsonObject));
}

function reviveContextContributionDates(value: ContextJsonObject): ContextContribution {
  const contribution = value as unknown as ContextContribution;

  return {
    ...contribution,
    provenance: reviveProvenanceRecordDates(contribution.provenance),
  };
}

function reviveProvenanceListDates(value: unknown): readonly ProvenanceRecord[] {
  if (!Array.isArray(value)) {
    throw new TypeError('Provenance list must be an array.');
  }

  return value.map((entry) =>
    reviveProvenanceRecordDates(entry as unknown as ProvenanceRecord),
  );
}

function reviveProvenanceRecordDates(provenance: ProvenanceRecord): ProvenanceRecord {
  return {
    ...provenance,
    retrievedAt: reviveDateField(provenance.retrievedAt as unknown as string, 'retrievedAt'),
  };
}

function reviveDateField(value: unknown, field: string): Date {
  if (typeof value !== 'string' || Number.isNaN(Date.parse(value))) {
    throw new TypeError(`${field} must be an ISO date string.`);
  }

  return new Date(value);
}

function toDeterministicJsonObject(value: ContextPackage): ContextJsonObject {
  return sortJsonObject({
    packageId: value.packageId,
    packageVersion: value.packageVersion,
    assembledAt: value.assembledAt.toISOString(),
    request: toDeterministicJsonValue(value.request) as ContextJsonObject,
    identity: toDeterministicJsonValue(value.identity) as ContextJsonObject,
    authorization: toDeterministicJsonValue(value.authorization) as ContextJsonObject,
    primaryEntity: serializeContextContribution(value.primaryEntity),
    relatedEntities: value.relatedEntities.map(serializeContextContribution),
    events: value.events.map(serializeContextContribution),
    organizationalMemory: value.organizationalMemory.map(serializeContextContribution),
    provenance: value.provenance.map(serializeProvenanceRecord),
    confidence: toDeterministicJsonValue(value.confidence) as ContextJsonObject,
    completeness: toDeterministicJsonValue(value.completeness) as ContextJsonObject,
    metadata: toDeterministicJsonValue(value.metadata) as ContextJsonObject,
  });
}

function serializeContextContribution(contribution: ContextContribution): ContextJsonObject {
  return sortJsonObject({
    contributorId: contribution.contributorId,
    section: contribution.section,
    subject:
      contribution.subject === null
        ? null
        : (toDeterministicJsonValue(contribution.subject) as ContextJsonObject),
    payload: toDeterministicJsonValue(contribution.payload) as ContextJsonObject,
    provenance: serializeProvenanceRecord(contribution.provenance),
  });
}

function serializeProvenanceRecord(provenance: ProvenanceRecord): ContextJsonObject {
  return sortJsonObject({
    sourceSystem: provenance.sourceSystem,
    sourceType: provenance.sourceType,
    ...(provenance.sourceId === undefined ? {} : { sourceId: provenance.sourceId }),
    retrievalMethod: provenance.retrievalMethod,
    retrievedAt: provenance.retrievedAt.toISOString(),
    permissionScope: [...provenance.permissionScope],
  });
}

function toDeterministicJsonValue(value: unknown): ContextJsonObject[keyof ContextJsonObject] {
  if (value === null) {
    return null;
  }

  if (value instanceof Date) {
    return value.toISOString();
  }

  const valueType = typeof value;
  if (valueType === 'string' || valueType === 'number' || valueType === 'boolean') {
    return value as ContextJsonObject[keyof ContextJsonObject];
  }

  if (Array.isArray(value)) {
    return value.map((entry) => toDeterministicJsonValue(entry));
  }

  if (isPlainObject(value)) {
    return sortJsonObject(
      Object.fromEntries(
        Object.entries(value).map(([key, entry]) => [key, toDeterministicJsonValue(entry)]),
      ),
    );
  }

  throw new TypeError('Value is not JSON-serializable.');
}

function sortJsonObject(value: Record<string, ContextJsonObject[keyof ContextJsonObject]>): ContextJsonObject {
  const sortedEntries = Object.entries(value).sort(([left], [right]) =>
    left.localeCompare(right),
  );

  return Object.fromEntries(sortedEntries);
}

function isPlainObject(value: unknown): value is Record<string, unknown> {
  if (typeof value !== 'object' || value === null || Array.isArray(value)) {
    return false;
  }

  const prototype = Object.getPrototypeOf(value);
  return prototype === null || prototype === Object.prototype;
}
