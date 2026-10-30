import type {
  ConfidenceFactorCode,
  ConfidenceFactorImpact,
  ConfidenceLevel,
  ContextSectionId,
  EntityType,
  CompletenessStatus,
} from './models';

export const ENTITY_TYPES = [
  'Organization',
  'Program',
  'Project',
  'Milestone',
  'Task',
] as const satisfies readonly EntityType[];

export const CONTEXT_SECTION_IDS = [
  'identity',
  'authorization',
  'primaryEntity',
  'relatedEntities',
  'events',
  'organizationalMemory',
  'provenance',
  'metadata',
] as const satisfies readonly ContextSectionId[];

/** Known contributor identifiers; not an exhaustive Phase 1 registry. */
export const KNOWN_CONTEXT_CONTRIBUTOR_IDS = [
  'operational.primaryEntity',
  'operational.relatedEntities',
  'operational.events',
  'organizationalMemory',
  'audit.evidence',
] as const;

export const CONFIDENCE_LEVELS = [
  'high',
  'medium',
  'low',
] as const satisfies readonly ConfidenceLevel[];

export const CONFIDENCE_FACTOR_CODES = [
  'primaryEntityResolved',
  'relatedEntitiesPartial',
  'relatedEntitiesComplete',
  'eventsIncluded',
  'organizationalMemoryUnavailable',
  'organizationalMemoryEmpty',
  'permissionRestrictedSlice',
] as const satisfies readonly ConfidenceFactorCode[];

export const CONFIDENCE_FACTOR_IMPACTS = [
  'increase',
  'decrease',
  'neutral',
] as const satisfies readonly ConfidenceFactorImpact[];

export const COMPLETENESS_STATUSES = [
  'complete',
  'degraded',
  'insufficient',
] as const satisfies readonly CompletenessStatus[];

export const PROVENANCE_SOURCE_SYSTEMS = [
  'synaptria.operational',
  'synaptria.events',
  'synaptria.organizationalMemory',
] as const;

export const PROVENANCE_RETRIEVAL_METHODS = [
  'repository.read',
  'repository.list',
  'eventRepository.findByAggregate',
  'eventRepository.listRecentForOrganization',
  'memoryProvider.retrieve',
] as const;

export const EVIDENCE_TYPES = [
  'operationalEntity',
  'domainEvent',
  'auditEvent',
  'memory',
  'document',
] as const;

export const CONTEXT_PACKAGE_VERSION = 1;
