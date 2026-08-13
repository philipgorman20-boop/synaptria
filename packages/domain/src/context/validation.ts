import { CoreError, identifier, type OrganizationId } from '@synaptria/core';
import type { OrganizationRole } from '@synaptria/core/context';

import {
  COMPLETENESS_STATUSES,
  CONFIDENCE_FACTOR_CODES,
  CONFIDENCE_FACTOR_IMPACTS,
  CONFIDENCE_LEVELS,
  CONTEXT_PACKAGE_VERSION,
  CONTEXT_SECTION_IDS,
  ENTITY_TYPES,
  EVIDENCE_TYPES,
  PROVENANCE_RETRIEVAL_METHODS,
  PROVENANCE_SOURCE_SYSTEMS,
} from './constants';
import type {
  AuditEvidenceReference,
  ConfidenceAssessment,
  ConfidenceFactor,
  ContextAuthorization,
  ContextCompleteness,
  ContextContribution,
  ContextContributorId,
  ContextIdentity,
  ContextJsonObject,
  ContextJsonValue,
  ContextPackage,
  ContextPackageMetadata,
  ContextPayload,
  ContextRequest,
  ContextScope,
  ContextSectionId,
  EntityReference,
  EntityType,
  EvidenceReference,
  EventEvidenceReference,
  ProvenanceRecord,
} from './models';

export function validateEntityReference(input: EntityReference): EntityReference {
  const organizationId = requireOrganizationId(input.organizationId, 'organizationId');
  const entityType = requireEntityType(input.entityType, 'entityType');
  const entityId = requireNonEmptyString(input.entityId, 'entityId');

  return {
    organizationId,
    entityType,
    entityId,
  };
}

export function validateContextRequest(input: ContextRequest): ContextRequest {
  const primaryEntity = validateEntityReference(input.primaryEntity);
  const requestedSections = requireUniqueContextSectionIds(
    input.requestedSections,
    'requestedSections',
  );

  return {
    primaryEntity,
    requestedSections,
    ...(input.objective === undefined
      ? {}
      : { objective: optionalNonEmptyString(input.objective, 'objective') }),
  };
}

export function validateContextScope(input: ContextScope): ContextScope {
  const organizationId = requireOrganizationId(input.organizationId, 'organizationId');
  const primaryEntity = validateEntityReference(input.primaryEntity);

  assertSameOrganization(
    organizationId,
    primaryEntity.organizationId,
    'primaryEntity.organizationId',
  );

  const includeDescendants = requireEntityTypeList(
    input.includeDescendants,
    'includeDescendants',
  );
  const eventLookbackPerAggregate = requirePositiveInteger(
    input.eventLookbackPerAggregate,
    'eventLookbackPerAggregate',
  );
  const maxContributions = requirePositiveInteger(input.maxContributions, 'maxContributions');

  return {
    organizationId,
    primaryEntity,
    includeDescendants,
    eventLookbackPerAggregate,
    maxContributions,
  };
}

export function validateProvenanceRecord(input: ProvenanceRecord): ProvenanceRecord {
  const sourceSystem = requireOneOf(
    input.sourceSystem,
    PROVENANCE_SOURCE_SYSTEMS,
    'sourceSystem',
  );
  const sourceType = requireNonEmptyString(input.sourceType, 'sourceType');
  const retrievalMethod = requireOneOf(
    input.retrievalMethod,
    PROVENANCE_RETRIEVAL_METHODS,
    'retrievalMethod',
  );
  const retrievedAt = requireValidDate(input.retrievedAt, 'retrievedAt');
  const permissionScope = requireStringList(input.permissionScope, 'permissionScope');

  return {
    sourceSystem,
    sourceType,
    retrievalMethod,
    retrievedAt,
    permissionScope,
    ...(input.sourceId === undefined
      ? {}
      : { sourceId: optionalNonEmptyString(input.sourceId, 'sourceId') }),
  };
}

export function validateEvidenceReference(input: EvidenceReference): EvidenceReference {
  const evidenceType = requireOneOf(input.evidenceType, EVIDENCE_TYPES, 'evidenceType');
  const reference = validateEvidenceReferenceTarget(evidenceType, input.reference);

  return {
    evidenceType,
    reference,
    ...(input.description === undefined
      ? {}
      : { description: optionalNonEmptyString(input.description, 'description') }),
  };
}

export function validateConfidenceAssessment(
  input: ConfidenceAssessment,
): ConfidenceAssessment {
  const level = requireOneOf(input.level, CONFIDENCE_LEVELS, 'level');
  const explanation = requireNonEmptyString(input.explanation, 'explanation');
  const factors = requireConfidenceFactors(input.factors);

  return {
    level,
    explanation,
    factors,
  };
}

export function validateContextCompleteness(input: ContextCompleteness): ContextCompleteness {
  const status = requireOneOf(input.status, COMPLETENESS_STATUSES, 'status');
  const missingSections = requireContextSectionIdList(
    input.missingSections,
    'missingSections',
    { allowDuplicates: true },
  );
  const degradationNotes = requireStringList(input.degradationNotes, 'degradationNotes');

  return {
    status,
    missingSections,
    degradationNotes,
  };
}

export function validateContextPayload(input: ContextPayload): ContextPayload {
  return assertContextJsonObject(input, 'payload');
}

export function validateContextContribution(input: ContextContribution): ContextContribution {
  const contributorId = requireContextContributorId(input.contributorId, 'contributorId');
  const section = requireContextSectionId(input.section, 'section');
  const subject = input.subject === null ? null : validateEntityReference(input.subject);
  const payload = validateContextPayload(input.payload);
  const provenance = validateProvenanceRecord(input.provenance);

  return {
    contributorId,
    section,
    subject,
    payload,
    provenance,
  };
}

export function validateContextIdentity(input: ContextIdentity): ContextIdentity {
  return {
    userId: requireBrandedId(input.userId, 'UserId', 'userId'),
    organizationId: requireOrganizationId(input.organizationId, 'organizationId'),
    membershipId: requireBrandedId(input.membershipId, 'MembershipId', 'membershipId'),
    requestId: requireBrandedId(input.requestId, 'RequestId', 'requestId'),
    correlationId: requireBrandedId(input.correlationId, 'CorrelationId', 'correlationId'),
  };
}

export function validateContextAuthorization(
  input: ContextAuthorization,
): ContextAuthorization {
  const role = requireOrganizationRole(input.role, 'role');
  const effectivePermissions = requireStringList(
    input.effectivePermissions,
    'effectivePermissions',
  );

  return {
    role,
    effectivePermissions,
  };
}

export function validateContextPackageMetadata(
  input: ContextPackageMetadata,
): ContextPackageMetadata {
  if (input.deterministic !== true) {
    throw validationError('deterministic must be true.', 'deterministic');
  }

  return {
    deterministic: true,
  };
}

export function validateContextPackage(input: ContextPackage): ContextPackage {
  if (!Number.isInteger(input.packageVersion) || input.packageVersion < 1) {
    throw validationError('packageVersion must be a positive integer.', 'packageVersion');
  }

  const packageId = requireBrandedId(input.packageId, 'ContextPackageId', 'packageId');
  const assembledAt = requireValidDate(input.assembledAt, 'assembledAt');
  const request = validateContextRequest(input.request);
  const identity = validateContextIdentity(input.identity);
  const authorization = validateContextAuthorization(input.authorization);
  const primaryEntity = validateContextContribution(input.primaryEntity);
  const relatedEntities = requireContextContributions(input.relatedEntities, 'relatedEntities');
  const events = requireContextContributions(input.events, 'events');
  const organizationalMemory = requireContextContributions(
    input.organizationalMemory,
    'organizationalMemory',
  );
  const provenance = requireProvenanceRecords(input.provenance, 'provenance');
  const confidence = validateConfidenceAssessment(input.confidence);
  const completeness = validateContextCompleteness(input.completeness);
  const metadata = validateContextPackageMetadata(input.metadata);

  assertSameOrganization(
    identity.organizationId,
    request.primaryEntity.organizationId,
    'request.primaryEntity.organizationId',
  );

  return {
    packageId,
    packageVersion: input.packageVersion,
    assembledAt,
    request,
    identity,
    authorization,
    primaryEntity,
    relatedEntities,
    events,
    organizationalMemory,
    provenance,
    confidence,
    completeness,
    metadata,
  };
}

export function assertContextJsonSerializable(
  value: unknown,
  field = 'value',
): ContextJsonValue {
  return assertContextJsonValue(value, field);
}

function validateEvidenceReferenceTarget(
  evidenceType: EvidenceReference['evidenceType'],
  reference: EvidenceReference['reference'],
): EntityReference | EventEvidenceReference | AuditEvidenceReference {
  if (isEntityReferenceShape(reference)) {
    const entityReference = validateEntityReference(reference);
    if (evidenceType === 'domainEvent' || evidenceType === 'auditEvent') {
      throw validationError(
        `${evidenceType} evidence requires an event or audit reference.`,
        'reference',
      );
    }
    return entityReference;
  }

  if (isEventEvidenceReferenceShape(reference)) {
    if (evidenceType !== 'domainEvent') {
      throw validationError(
        'domainEvent evidence requires an eventId reference.',
        'reference',
      );
    }
    return {
      eventId: requireBrandedId(reference.eventId, 'DomainEventId', 'reference.eventId'),
    };
  }

  if (isAuditEvidenceReferenceShape(reference)) {
    if (evidenceType !== 'auditEvent') {
      throw validationError(
        'auditEvent evidence requires an auditEventId reference.',
        'reference',
      );
    }
    return {
      auditEventId: requireNonEmptyString(reference.auditEventId, 'reference.auditEventId'),
    };
  }

  throw validationError('reference must be a supported evidence target.', 'reference');
}

function requireContextContributions(
  values: readonly ContextContribution[],
  field: string,
): readonly ContextContribution[] {
  if (!Array.isArray(values)) {
    throw validationError(`${field} must be an array.`, field);
  }

  return values.map((value, index) => {
    try {
      return validateContextContribution(value);
    } catch (error) {
      rethrowWithField(error, `${field}[${index}]`);
    }
  });
}

function requireProvenanceRecords(
  values: readonly ProvenanceRecord[],
  field: string,
): readonly ProvenanceRecord[] {
  if (!Array.isArray(values)) {
    throw validationError(`${field} must be an array.`, field);
  }

  return values.map((value, index) => {
    try {
      return validateProvenanceRecord(value);
    } catch (error) {
      rethrowWithField(error, `${field}[${index}]`);
    }
  });
}

function requireConfidenceFactors(values: readonly ConfidenceFactor[]): readonly ConfidenceFactor[] {
  if (!Array.isArray(values)) {
    throw validationError('factors must be an array.', 'factors');
  }

  return values.map((factor, index) => {
    const code = requireOneOf(factor.code, CONFIDENCE_FACTOR_CODES, `factors[${index}].code`);
    const impact = requireOneOf(
      factor.impact,
      CONFIDENCE_FACTOR_IMPACTS,
      `factors[${index}].impact`,
    );
    const message = requireNonEmptyString(factor.message, `factors[${index}].message`);

    return { code, impact, message };
  });
}

function requireUniqueContextSectionIds(
  values: readonly ContextSectionId[],
  field: string,
): readonly ContextSectionId[] {
  return requireContextSectionIdList(values, field, { allowDuplicates: false });
}

function requireContextSectionIdList(
  values: readonly ContextSectionId[],
  field: string,
  options: { readonly allowDuplicates: boolean },
): readonly ContextSectionId[] {
  if (!Array.isArray(values)) {
    throw validationError(`${field} must be an array.`, field);
  }

  const normalized: ContextSectionId[] = [];
  const seen = new Set<ContextSectionId>();

  for (const [index, value] of values.entries()) {
    const section = requireContextSectionId(value, `${field}[${index}]`);
    if (!options.allowDuplicates && seen.has(section)) {
      throw validationError(`${field} contains duplicate section "${section}".`, field);
    }
    seen.add(section);
    normalized.push(section);
  }

  return normalized;
}

function requireEntityTypeList(
  values: readonly EntityType[],
  field: string,
): readonly EntityType[] {
  if (!Array.isArray(values)) {
    throw validationError(`${field} must be an array.`, field);
  }

  const normalized: EntityType[] = [];
  const seen = new Set<EntityType>();

  for (const [index, value] of values.entries()) {
    const entityType = requireEntityType(value, `${field}[${index}]`);
    if (seen.has(entityType)) {
      throw validationError(`${field} contains duplicate entity type "${entityType}".`, field);
    }
    seen.add(entityType);
    normalized.push(entityType);
  }

  return normalized;
}

function requireStringList(values: readonly string[], field: string): readonly string[] {
  if (!Array.isArray(values)) {
    throw validationError(`${field} must be an array.`, field);
  }

  return values.map((value, index) =>
    requireNonEmptyString(value, `${field}[${index}]`),
  );
}

function assertContextJsonObject(value: unknown, field: string): ContextJsonObject {
  const normalized = assertContextJsonValue(value, field);
  if (normalized === null || typeof normalized !== 'object' || Array.isArray(normalized)) {
    throw validationError(`${field} must be a JSON object.`, field);
  }
  return normalized as ContextJsonObject;
}

function assertContextJsonValue(value: unknown, field: string): ContextJsonValue {
  if (value === null) {
    return null;
  }

  const valueType = typeof value;
  if (valueType === 'string' || valueType === 'number' || valueType === 'boolean') {
    if (valueType === 'number' && !Number.isFinite(value as number)) {
      throw validationError(`${field} must be a finite JSON value.`, field);
    }
    return value as ContextJsonValue;
  }

  if (Array.isArray(value)) {
    return value.map((entry, index) => assertContextJsonValue(entry, `${field}[${index}]`));
  }

  if (isPlainObject(value)) {
    const normalized: Record<string, ContextJsonValue> = {};
    for (const [key, entry] of Object.entries(value)) {
      if (key.length === 0) {
        throw validationError(`${field} contains an empty object key.`, field);
      }
      normalized[key] = assertContextJsonValue(entry, `${field}.${key}`);
    }
    return normalized;
  }

  throw validationError(`${field} must be JSON-serializable.`, field);
}

function requireOrganizationId(value: OrganizationId, field: string): OrganizationId {
  return requireBrandedId(value, 'OrganizationId', field);
}

function requireBrandedId<TName extends string>(
  value: string,
  name: TName,
  field: string,
): ReturnType<typeof identifier<TName>> {
  if (typeof value !== 'string' || value.trim().length === 0) {
    throw validationError(`${field} cannot be empty.`, field);
  }

  try {
    return identifier(value, name);
  } catch {
    throw validationError(`${field} cannot be empty.`, field);
  }
}

function requireEntityType(value: string, field: string): EntityType {
  if (!(ENTITY_TYPES as readonly string[]).includes(value)) {
    throw validationError(`${field} must be a supported entity type.`, field);
  }
  return value as EntityType;
}

function requireContextSectionId(value: string, field: string): ContextSectionId {
  if (!(CONTEXT_SECTION_IDS as readonly string[]).includes(value)) {
    throw validationError(`${field} must be a supported context section.`, field);
  }
  return value as ContextSectionId;
}

function requireContextContributorId(value: string, field: string): ContextContributorId {
  return requireBrandedId(value, 'ContextContributorId', field);
}

function requireOrganizationRole(value: string, field: string): OrganizationRole {
  if (value !== 'OWNER' && value !== 'ADMIN' && value !== 'MEMBER' && value !== 'VIEWER') {
    throw validationError(`${field} must be a supported organization role.`, field);
  }
  return value;
}

function requireOneOf<T extends string>(
  value: string,
  allowed: readonly T[],
  field: string,
): T {
  if (!(allowed as readonly string[]).includes(value)) {
    throw validationError(`${field} must be a supported value.`, field);
  }
  return value as T;
}

function requireNonEmptyString(value: string, field: string): string {
  const normalized = value.trim();
  if (normalized.length === 0) {
    throw validationError(`${field} cannot be empty.`, field);
  }
  return normalized;
}

function optionalNonEmptyString(value: string, field: string): string {
  return requireNonEmptyString(value, field);
}

function requireValidDate(value: Date, field: string): Date {
  if (!(value instanceof Date) || Number.isNaN(value.getTime())) {
    throw validationError(`${field} must be a valid date.`, field);
  }
  return value;
}

function requirePositiveInteger(value: number, field: string): number {
  if (!Number.isInteger(value) || value < 1) {
    throw validationError(`${field} must be a positive integer.`, field);
  }
  return value;
}

function assertSameOrganization(
  expected: OrganizationId,
  actual: OrganizationId,
  field: string,
): void {
  if (expected !== actual) {
    throw validationError(`${field} must match the organization scope.`, field);
  }
}

function isPlainObject(value: unknown): value is Record<string, unknown> {
  if (typeof value !== 'object' || value === null || Array.isArray(value)) {
    return false;
  }

  const prototype = Object.getPrototypeOf(value);
  return prototype === null || prototype === Object.prototype;
}

function isEntityReferenceShape(value: unknown): value is EntityReference {
  return (
    isPlainObject(value) &&
    'organizationId' in value &&
    'entityType' in value &&
    'entityId' in value &&
    !('eventId' in value) &&
    !('auditEventId' in value)
  );
}

function isEventEvidenceReferenceShape(value: unknown): value is EventEvidenceReference {
  return isPlainObject(value) && 'eventId' in value && !('auditEventId' in value);
}

function isAuditEvidenceReferenceShape(value: unknown): value is AuditEvidenceReference {
  return isPlainObject(value) && 'auditEventId' in value && !('eventId' in value);
}

function validationError(message: string, field: string): CoreError {
  return new CoreError({
    code: 'VALIDATION_FAILED',
    message,
    details: { field },
  });
}

function rethrowWithField(error: unknown, field: string): never {
  if (error instanceof CoreError && error.code === 'VALIDATION_FAILED') {
    throw new CoreError({
      code: error.code,
      message: error.message,
      details: {
        field,
        ...(error.details ?? {}),
      },
    });
  }

  throw error;
}

export { CONTEXT_PACKAGE_VERSION };
