import type {
  CorrelationId,
  Identifier,
  MembershipId,
  OrganizationId,
  RequestId,
  UserId,
} from '@synaptria/core';
import type { OrganizationRole } from '@synaptria/core/context';

export type ContextPackageId = Identifier<'ContextPackageId'>;
export type DomainEventReferenceId = Identifier<'DomainEventId'>;

export type EntityType =
  | 'Organization'
  | 'Program'
  | 'Project'
  | 'Milestone'
  | 'Task';

export type ContextSectionId =
  | 'identity'
  | 'authorization'
  | 'primaryEntity'
  | 'relatedEntities'
  | 'events'
  | 'organizationalMemory'
  | 'provenance'
  | 'metadata';

export type ContextContributorId = Identifier<'ContextContributorId'>;

export type ContextJsonPrimitive = string | number | boolean | null;
export type ContextJsonValue =
  | ContextJsonPrimitive
  | ContextJsonObject
  | readonly ContextJsonValue[];
export type ContextJsonObject = Readonly<{ [key: string]: ContextJsonValue }>;
export type ContextPayload = ContextJsonObject;

export interface EntityReference {
  readonly organizationId: OrganizationId;
  readonly entityType: EntityType;
  readonly entityId: string;
}

export interface ContextRequest {
  readonly primaryEntity: EntityReference;
  readonly objective?: string;
  readonly requestedSections: readonly ContextSectionId[];
}

export interface ContextScope {
  readonly organizationId: OrganizationId;
  readonly primaryEntity: EntityReference;
  readonly includeDescendants: readonly EntityType[];
  readonly eventLookbackPerAggregate: number;
  readonly maxContributions: number;
}

export interface ContextIdentity {
  readonly userId: UserId;
  readonly organizationId: OrganizationId;
  readonly membershipId: MembershipId;
  readonly requestId: RequestId;
  readonly correlationId: CorrelationId;
}

export interface ContextAuthorization {
  readonly role: OrganizationRole;
  readonly effectivePermissions: readonly string[];
}

export interface ContextPackageMetadata {
  readonly deterministic: true;
}

export interface ProvenanceRecord {
  readonly sourceSystem:
    | 'synaptria.operational'
    | 'synaptria.events'
    | 'synaptria.organizationalMemory';
  readonly sourceType: string;
  readonly sourceId?: string;
  readonly retrievalMethod:
    | 'repository.read'
    | 'repository.list'
    | 'eventRepository.findByAggregate'
    | 'eventRepository.listRecentForOrganization'
    | 'memoryProvider.retrieve';
  readonly retrievedAt: Date;
  readonly permissionScope: readonly string[];
}

export interface EventEvidenceReference {
  readonly eventId: DomainEventReferenceId;
}

export interface AuditEvidenceReference {
  readonly auditEventId: string;
}

export interface EvidenceReference {
  readonly evidenceType:
    | 'operationalEntity'
    | 'domainEvent'
    | 'auditEvent'
    | 'memory'
    | 'document';
  readonly reference: EntityReference | EventEvidenceReference | AuditEvidenceReference;
  readonly description?: string;
}

export type ConfidenceLevel = 'high' | 'medium' | 'low';

export type ConfidenceFactorCode =
  | 'primaryEntityResolved'
  | 'relatedEntitiesPartial'
  | 'relatedEntitiesComplete'
  | 'eventsIncluded'
  | 'organizationalMemoryUnavailable'
  | 'organizationalMemoryEmpty'
  | 'permissionRestrictedSlice';

export type ConfidenceFactorImpact = 'increase' | 'decrease' | 'neutral';

export interface ConfidenceFactor {
  readonly code: ConfidenceFactorCode;
  readonly impact: ConfidenceFactorImpact;
  readonly message: string;
}

export interface ConfidenceAssessment {
  readonly level: ConfidenceLevel;
  readonly factors: readonly ConfidenceFactor[];
  readonly explanation: string;
}

export type CompletenessStatus = 'complete' | 'degraded' | 'insufficient';

export interface ContextCompleteness {
  readonly status: CompletenessStatus;
  readonly missingSections: readonly ContextSectionId[];
  readonly degradationNotes: readonly string[];
}

export interface ContextContribution {
  readonly contributorId: ContextContributorId;
  readonly section: ContextSectionId;
  readonly subject: EntityReference | null;
  readonly payload: ContextPayload;
  readonly provenance: ProvenanceRecord;
}

export interface ContextPackage {
  readonly packageId: ContextPackageId;
  readonly packageVersion: number;
  readonly assembledAt: Date;
  readonly request: ContextRequest;
  readonly identity: ContextIdentity;
  readonly authorization: ContextAuthorization;
  readonly primaryEntity: ContextContribution;
  readonly relatedEntities: readonly ContextContribution[];
  readonly events: readonly ContextContribution[];
  readonly organizationalMemory: readonly ContextContribution[];
  readonly provenance: readonly ProvenanceRecord[];
  readonly confidence: ConfidenceAssessment;
  readonly completeness: ContextCompleteness;
  readonly metadata: ContextPackageMetadata;
}
