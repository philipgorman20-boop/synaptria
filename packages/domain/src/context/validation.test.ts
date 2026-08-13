import assert from 'node:assert/strict';
import test from 'node:test';

import { CoreError } from '@synaptria/core';
import {
  correlationId,
  identifier,
  membershipId,
  organizationId,
  requestId,
  userId,
} from '@synaptria/core';

import type {
  ConfidenceAssessment,
  ContextCompleteness,
  ContextContribution,
  ContextPackage,
  ContextRequest,
  ContextScope,
  EntityReference,
  EvidenceReference,
  ProvenanceRecord,
} from './models';
import {
  parseContextPackage,
  serializeContextPackage,
  serializeContextPackageJson,
} from './serialization';
import {
  assertContextJsonSerializable,
  validateConfidenceAssessment,
  validateContextCompleteness,
  validateContextContribution,
  validateContextPackage,
  validateContextRequest,
  validateContextScope,
  validateEntityReference,
  validateEvidenceReference,
  validateProvenanceRecord,
} from './validation';

const ORGANIZATION_ID = organizationId('org-1');
const OTHER_ORGANIZATION_ID = organizationId('org-2');
const USER_ID = userId('user-1');
const MEMBERSHIP_ID = membershipId('membership-1');
const REQUEST_ID = requestId('request-1');
const CORRELATION_ID = correlationId('correlation-1');
const PACKAGE_ID = identifier('package-1', 'ContextPackageId');
const EVENT_ID = identifier('event-1', 'DomainEventId');
const PRIMARY_ENTITY_CONTRIBUTOR_ID = identifier(
  'operational.primaryEntity',
  'ContextContributorId',
);
const ASSEMBLED_AT = new Date('2026-07-26T16:00:00.000Z');
const RETRIEVED_AT = new Date('2026-07-26T15:59:00.000Z');

function entityReference(overrides: Partial<EntityReference> = {}): EntityReference {
  return {
    organizationId: ORGANIZATION_ID,
    entityType: 'Project',
    entityId: 'project-1',
    ...overrides,
  };
}

function provenanceRecord(overrides: Partial<ProvenanceRecord> = {}): ProvenanceRecord {
  return {
    sourceSystem: 'synaptria.operational',
    sourceType: 'Project',
    sourceId: 'project-1',
    retrievalMethod: 'repository.read',
    retrievedAt: RETRIEVED_AT,
    permissionScope: ['project.read'],
    ...overrides,
  };
}

function contextContribution(
  overrides: Partial<ContextContribution> = {},
): ContextContribution {
  return {
    contributorId: PRIMARY_ENTITY_CONTRIBUTOR_ID,
    section: 'primaryEntity',
    subject: entityReference(),
    payload: { name: 'Phase 1 study' },
    provenance: provenanceRecord(),
    ...overrides,
  };
}

function contextRequest(overrides: Partial<ContextRequest> = {}): ContextRequest {
  return {
    primaryEntity: entityReference(),
    objective: 'Summarize project context',
    requestedSections: ['primaryEntity', 'relatedEntities', 'events'],
    ...overrides,
  };
}

function contextScope(overrides: Partial<ContextScope> = {}): ContextScope {
  return {
    organizationId: ORGANIZATION_ID,
    primaryEntity: entityReference(),
    includeDescendants: ['Milestone', 'Task'],
    eventLookbackPerAggregate: 25,
    maxContributions: 10,
    ...overrides,
  };
}

function confidenceAssessment(
  overrides: Partial<ConfidenceAssessment> = {},
): ConfidenceAssessment {
  return {
    level: 'high',
    explanation: 'Primary entity resolved with complete related entities.',
    factors: [
      {
        code: 'primaryEntityResolved',
        impact: 'increase',
        message: 'Primary entity was loaded successfully.',
      },
    ],
    ...overrides,
  };
}

function contextCompleteness(
  overrides: Partial<ContextCompleteness> = {},
): ContextCompleteness {
  return {
    status: 'complete',
    missingSections: [],
    degradationNotes: [],
    ...overrides,
  };
}

function contextPackage(overrides: Partial<ContextPackage> = {}): ContextPackage {
  return {
    packageId: PACKAGE_ID,
    packageVersion: 1,
    assembledAt: ASSEMBLED_AT,
    request: contextRequest(),
    identity: {
      userId: USER_ID,
      organizationId: ORGANIZATION_ID,
      membershipId: MEMBERSHIP_ID,
      requestId: REQUEST_ID,
      correlationId: CORRELATION_ID,
    },
    authorization: {
      role: 'MEMBER',
      effectivePermissions: ['project.read', 'milestone.read'],
    },
    primaryEntity: contextContribution(),
    relatedEntities: [],
    events: [],
    organizationalMemory: [],
    provenance: [provenanceRecord()],
    confidence: confidenceAssessment(),
    completeness: contextCompleteness(),
    metadata: {
      deterministic: true,
    },
    ...overrides,
  };
}

function expectValidationError(fn: () => unknown, field: string): void {
  assert.throws(fn, (error: unknown) => {
    assert.ok(error instanceof CoreError);
    assert.equal(error.code, 'VALIDATION_FAILED');
    assert.equal(error.details?.field, field);
    return true;
  });
}

test('validateEntityReference accepts a valid entity reference', () => {
  const validated = validateEntityReference(entityReference());

  assert.deepEqual(validated, entityReference());
});

test('validateContextRequest accepts a valid request', () => {
  const validated = validateContextRequest(contextRequest());

  assert.deepEqual(validated, contextRequest());
});

test('validateContextScope accepts a valid scope', () => {
  const validated = validateContextScope(contextScope());

  assert.deepEqual(validated, contextScope());
});

test('validateProvenanceRecord accepts a valid provenance record', () => {
  const validated = validateProvenanceRecord(provenanceRecord());

  assert.deepEqual(validated, provenanceRecord());
});

test('validateEvidenceReference accepts valid evidence references', () => {
  const operational = validateEvidenceReference({
    evidenceType: 'operationalEntity',
    reference: entityReference(),
    description: 'Primary project record',
  });
  const domainEvent = validateEvidenceReference({
    evidenceType: 'domainEvent',
    reference: { eventId: EVENT_ID },
  });
  const auditEvent = validateEvidenceReference({
    evidenceType: 'auditEvent',
    reference: { auditEventId: 'audit-1' },
  });

  assert.equal(operational.evidenceType, 'operationalEntity');
  assert.equal(
    'eventId' in domainEvent.reference ? domainEvent.reference.eventId : null,
    EVENT_ID,
  );
  assert.equal(
    (auditEvent.reference as { auditEventId: string }).auditEventId,
    'audit-1',
  );
});

test('validateConfidenceAssessment accepts valid confidence levels', () => {
  for (const level of ['high', 'medium', 'low'] as const) {
    const validated = validateConfidenceAssessment(
      confidenceAssessment({ level }),
    );
    assert.equal(validated.level, level);
  }
});

test('validateContextCompleteness accepts valid completeness statuses', () => {
  for (const status of ['complete', 'degraded', 'insufficient'] as const) {
    const validated = validateContextCompleteness(
      contextCompleteness({ status }),
    );
    assert.equal(validated.status, status);
  }
});

test('validateContextContribution accepts a valid contribution', () => {
  const validated = validateContextContribution(contextContribution());

  assert.deepEqual(validated, contextContribution());
});

test('validateContextPackage accepts a valid package', () => {
  const validated = validateContextPackage(contextPackage());

  assert.deepEqual(validated, contextPackage());
});

test('validateEntityReference rejects empty required identifiers', () => {
  expectValidationError(
    () =>
      validateEntityReference(
        entityReference({ entityId: '   ' }),
      ),
    'entityId',
  );
});

test('validateContextIdentity rejects empty required identifiers', () => {
  expectValidationError(
    () =>
      validateContextPackage(
        contextPackage({
          identity: {
            userId: '   ' as ReturnType<typeof userId>,
            organizationId: ORGANIZATION_ID,
            membershipId: MEMBERSHIP_ID,
            requestId: REQUEST_ID,
            correlationId: CORRELATION_ID,
          },
        }),
      ),
    'userId',
  );
});

test('validateContextScope enforces organization-scope invariants', () => {
  expectValidationError(
    () =>
      validateContextScope(
        contextScope({
          organizationId: ORGANIZATION_ID,
          primaryEntity: entityReference({ organizationId: OTHER_ORGANIZATION_ID }),
        }),
      ),
    'primaryEntity.organizationId',
  );

  expectValidationError(
    () =>
      validateContextPackage(
        contextPackage({
          identity: {
            userId: USER_ID,
            organizationId: ORGANIZATION_ID,
            membershipId: MEMBERSHIP_ID,
            requestId: REQUEST_ID,
            correlationId: CORRELATION_ID,
          },
          request: contextRequest({
            primaryEntity: entityReference({ organizationId: OTHER_ORGANIZATION_ID }),
          }),
        }),
      ),
    'request.primaryEntity.organizationId',
  );
});

test('validateEntityReference rejects malformed entity references', () => {
  expectValidationError(
    () =>
      validateEntityReference(
        entityReference({ entityType: 'InvalidType' as EntityReference['entityType'] }),
      ),
    'entityType',
  );

  expectValidationError(
    () => validateEntityReference(entityReference({ organizationId: '   ' as typeof ORGANIZATION_ID })),
    'organizationId',
  );
});

test('validateConfidenceAssessment rejects invalid confidence values', () => {
  expectValidationError(
    () =>
      validateConfidenceAssessment(
        confidenceAssessment({ level: 'very-high' as ConfidenceAssessment['level'] }),
      ),
    'level',
  );

  expectValidationError(
    () =>
      validateConfidenceAssessment(
        confidenceAssessment({
          factors: [
            {
              code: 'unknown-factor' as ConfidenceAssessment['factors'][number]['code'],
              impact: 'increase',
              message: 'Unknown factor',
            },
          ],
        }),
      ),
    'factors[0].code',
  );
});

test('validateContextCompleteness rejects invalid completeness values', () => {
  expectValidationError(
    () =>
      validateContextCompleteness(
        contextCompleteness({ status: 'partial' as ContextCompleteness['status'] }),
      ),
    'status',
  );
});

test('validateProvenanceRecord rejects malformed provenance', () => {
  expectValidationError(
    () =>
      validateProvenanceRecord(
        provenanceRecord({ sourceSystem: 'external.system' as ProvenanceRecord['sourceSystem'] }),
      ),
    'sourceSystem',
  );

  expectValidationError(
    () =>
      validateProvenanceRecord(
        provenanceRecord({ retrievedAt: new Date('invalid') }),
      ),
    'retrievedAt',
  );
});

test('validateEvidenceReference rejects malformed evidence references', () => {
  expectValidationError(
    () =>
      validateEvidenceReference({
        evidenceType: 'domainEvent',
        reference: entityReference(),
      }),
    'reference',
  );

  expectValidationError(
    () =>
      validateEvidenceReference({
        evidenceType: 'operationalEntity',
        reference: { eventId: EVENT_ID },
      }),
    'reference',
  );

  expectValidationError(
    () =>
      validateEvidenceReference({
        evidenceType: 'auditEvent',
        reference: { auditEventId: '   ' },
      }),
    'reference.auditEventId',
  );
});

test('validateContextRequest rejects duplicate requested section identifiers', () => {
  expectValidationError(
    () =>
      validateContextRequest(
        contextRequest({
          requestedSections: ['primaryEntity', 'primaryEntity'],
        }),
      ),
    'requestedSections',
  );
});

test('validateContextPackage accepts multiple contributions from the same contributor and section', () => {
  const relatedEntityContribution = contextContribution({
    contributorId: identifier('operational.relatedEntities', 'ContextContributorId'),
    section: 'relatedEntities',
    subject: entityReference({ entityType: 'Milestone', entityId: 'milestone-1' }),
    payload: { entities: [] },
  });

  const validated = validateContextPackage(
    contextPackage({
      relatedEntities: [relatedEntityContribution, relatedEntityContribution],
    }),
  );

  assert.equal(validated.relatedEntities.length, 2);
});

test('validateContextContribution accepts custom contributor identifiers', () => {
  const validated = validateContextContribution(
    contextContribution({
      contributorId: identifier('custom.provider.v1', 'ContextContributorId'),
    }),
  );

  assert.equal(validated.contributorId, 'custom.provider.v1');
});

test('serializeContextPackage produces deterministic JSON serialization', () => {
  const first = serializeContextPackageJson(contextPackage());
  const second = serializeContextPackageJson(contextPackage());

  assert.equal(first, second);
  assert.doesNotThrow(() => JSON.parse(first));
});

test('parseContextPackage round-trips validated packages', () => {
  const serialized = serializeContextPackage(contextPackage());
  const parsed = parseContextPackage(serialized);

  assert.equal(parsed.packageId, PACKAGE_ID);
  assert.equal(parsed.assembledAt.toISOString(), ASSEMBLED_AT.toISOString());
  assert.equal(parsed.primaryEntity.provenance.retrievedAt.toISOString(), RETRIEVED_AT.toISOString());
});

test('validateContextScope treats includeDescendants as a value-only list', () => {
  const projectScope = validateContextScope(
    contextScope({
      includeDescendants: ['Milestone'],
    }),
  );
  const milestoneScope = validateContextScope(
    contextScope({
      primaryEntity: entityReference({ entityType: 'Milestone', entityId: 'milestone-1' }),
      includeDescendants: ['Task'],
    }),
  );
  const emptyDescendants = validateContextScope(
    contextScope({
      includeDescendants: [],
    }),
  );

  assert.deepEqual(projectScope.includeDescendants, ['Milestone']);
  assert.deepEqual(milestoneScope.includeDescendants, ['Task']);
  assert.deepEqual(emptyDescendants.includeDescendants, []);
});

test('validateContextScope rejects duplicate includeDescendants values', () => {
  expectValidationError(
    () =>
      validateContextScope(
        contextScope({
          includeDescendants: ['Task', 'Task'],
        }),
      ),
    'includeDescendants',
  );
});

test('assertContextJsonSerializable rejects malformed and non-serializable structures', () => {
  assert.deepEqual(assertContextJsonSerializable({ key: 'value' }), { key: 'value' });
  assert.deepEqual(assertContextJsonSerializable(['a', 1, false, null]), ['a', 1, false, null]);

  expectValidationError(
    () => assertContextJsonSerializable(() => 'not-json'),
    'value',
  );

  expectValidationError(
    () => assertContextJsonSerializable(Number.NaN),
    'value',
  );

  expectValidationError(
    () => assertContextJsonSerializable(new Map([['key', 'value']])),
    'value',
  );

  expectValidationError(
    () =>
      validateContextContribution(
        contextContribution({
          payload: { invalid: Symbol('secret') } as unknown as ContextContribution['payload'],
        }),
      ),
    'payload.invalid',
  );
});

test('validateContextScope rejects invalid numeric boundaries', () => {
  expectValidationError(
    () => validateContextScope(contextScope({ eventLookbackPerAggregate: 0 })),
    'eventLookbackPerAggregate',
  );

  expectValidationError(
    () => validateContextScope(contextScope({ maxContributions: -1 })),
    'maxContributions',
  );
});
