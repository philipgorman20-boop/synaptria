import assert from 'node:assert/strict';
import test from 'node:test';

import { FixedClock, identifier } from '@synaptria/core';
import { AuthorizationDeniedError } from '@synaptria/core/errors';
import type { ContextContribution, ContextRequest } from '@synaptria/domain/context';
import { serializeContextPackageJson } from '@synaptria/domain/context';

import { ApplicationError } from '../../shared/application-error';
import { assessConfidence } from './assessment';
import type { AssembleContextContext } from './assemble-context';
import { AssembleContextUseCase } from './assemble-context';
import { MILESTONE_INTELLIGENCE_V0 } from './capabilities/milestone-intelligence-v0';
import { MILESTONE_INTELLIGENCE_V0_CAPABILITY_ID } from './capabilities/milestone-intelligence-v0';
import { PROJECT_INTELLIGENCE_V0 } from './capabilities/project-intelligence-v0';
import { PROJECT_INTELLIGENCE_V0_CAPABILITY_ID } from './capabilities/project-intelligence-v0';
import type { ContextCapabilityDefinition } from './capabilities/types';
import { CONTEXT_CONTRIBUTOR_IDS } from './contributor-ids';
import { enforceContributionBudget } from './enforce-contribution-budget';
import type { ContextProvider } from './ports/context-provider';
import type { OrganizationalMemoryProvider } from './ports/organizational-memory-provider';
import { resolveContextScope } from './scope/resolve-context-scope';
import {
  CORRELATION_ID,
  MEMBERSHIP_ID,
  MILESTONE_B_ID,
  MILESTONE_ID,
  NOW,
  ORGANIZATION_ID,
  OTHER_ORGANIZATION_ID,
  PROJECT_ID,
  REQUEST_ID,
  TASK_B_ID,
  TASK_ID,
  USER_ID,
  domainEventFixture,
  milestoneFixture,
  projectFixture,
  taskFixture,
  InMemoryEventRepository,
  InMemoryMilestoneRepository,
  InMemoryProjectRepository,
  InMemoryTaskRepository,
  SpyEventRepository,
} from './testing/fixtures';
import { createAssembleContextDependencies, createAssembleContextUseCase } from './testing/test-harness';

const ASSEMBLE_CONTEXT: AssembleContextContext = {
  userId: USER_ID,
  organizationId: ORGANIZATION_ID,
  membershipId: MEMBERSHIP_ID,
  role: 'MEMBER',
  requestId: REQUEST_ID,
  correlationId: CORRELATION_ID,
};

function projectRequest(overrides: Partial<ContextRequest> = {}): ContextRequest {
  return {
    primaryEntity: {
      organizationId: ORGANIZATION_ID,
      entityType: 'Project',
      entityId: PROJECT_ID,
    },
    objective: 'Summarize project execution context',
    requestedSections: [
      'identity',
      'authorization',
      'primaryEntity',
      'relatedEntities',
      'events',
      'organizationalMemory',
      'provenance',
      'metadata',
    ],
    ...overrides,
  };
}

function milestoneRequest(overrides: Partial<ContextRequest> = {}): ContextRequest {
  return {
    primaryEntity: {
      organizationId: ORGANIZATION_ID,
      entityType: 'Milestone',
      entityId: MILESTONE_ID,
    },
    objective: 'Summarize milestone execution context',
    requestedSections: [
      'identity',
      'authorization',
      'primaryEntity',
      'relatedEntities',
      'events',
      'organizationalMemory',
      'provenance',
      'metadata',
    ],
    ...overrides,
  };
}

test('project capability assembles a validated context package', async () => {
  const useCase = createAssembleContextUseCase({
    projects: new InMemoryProjectRepository([projectFixture()]),
    milestones: new InMemoryMilestoneRepository([
      milestoneFixture({ id: MILESTONE_B_ID, name: 'Beta Milestone' }),
      milestoneFixture(),
    ]),
    tasks: new InMemoryTaskRepository([]),
    events: new InMemoryEventRepository([
      domainEventFixture(),
      domainEventFixture({
        id: identifier('event-2', 'DomainEventId'),
        aggregateType: 'Milestone',
        aggregateId: MILESTONE_ID,
        eventType: 'milestone.created',
      }),
    ]),
  });

  const { contextPackage } = await useCase.execute(ASSEMBLE_CONTEXT, {
    capabilityId: PROJECT_INTELLIGENCE_V0_CAPABILITY_ID,
    request: projectRequest(),
  });

  assert.equal(contextPackage.primaryEntity.payload.name, 'Alpha Study');
  assert.equal(contextPackage.relatedEntities.length, 1);
  assert.equal(
    (contextPackage.relatedEntities[0]?.payload.entities as readonly unknown[]).length,
    2,
  );
  assert.ok(contextPackage.events.length >= 1);
  assert.equal(contextPackage.organizationalMemory.length, 0);
  assert.equal(contextPackage.identity.userId, USER_ID);
  assert.ok(contextPackage.authorization.effectivePermissions.includes('projects.read'));
  assert.equal(contextPackage.metadata.deterministic, true);
});

test('milestone capability assembles related tasks and events', async () => {
  const useCase = createAssembleContextUseCase({
    projects: new InMemoryProjectRepository([projectFixture()]),
    milestones: new InMemoryMilestoneRepository([milestoneFixture()]),
    tasks: new InMemoryTaskRepository([
      taskFixture({ id: TASK_B_ID, name: 'Beta Task' }),
      taskFixture(),
    ]),
    events: new InMemoryEventRepository([
      domainEventFixture({
        aggregateType: 'Milestone',
        aggregateId: MILESTONE_ID,
        eventType: 'milestone.created',
      }),
    ]),
  });

  const { contextPackage } = await useCase.execute(ASSEMBLE_CONTEXT, {
    capabilityId: MILESTONE_INTELLIGENCE_V0_CAPABILITY_ID,
    request: milestoneRequest(),
  });

  assert.equal(contextPackage.primaryEntity.payload.name, 'Protocol Draft');
  assert.equal(
    (contextPackage.relatedEntities[0]?.payload.entities as readonly unknown[]).length,
    2,
  );
  assert.equal(contextPackage.events.length, 3);
});

test('primary-entity authorization is checked before provider reads', async () => {
  let primaryProviderCalled = false;
  let relatedProviderCalled = false;

  const baseDependencies = createAssembleContextDependencies({
    projects: new InMemoryProjectRepository([projectFixture()]),
    milestones: new InMemoryMilestoneRepository([]),
    tasks: new InMemoryTaskRepository([]),
    events: new InMemoryEventRepository([]),
  });

  const useCase = new AssembleContextUseCase({
    ...baseDependencies,
    contextAssemblyAuthorizer: {
      authorizePrimaryEntityRead() {
        throw new AuthorizationDeniedError('Missing required permission: projects.read.');
      },
    },
    primaryEntityProvider: {
      contributorId: CONTEXT_CONTRIBUTOR_IDS.primaryEntity,
      sections: ['primaryEntity'],
      async contribute() {
        primaryProviderCalled = true;
        throw new Error('primary provider should not be called after authorization failure');
      },
    } as never,
    relatedEntitiesProvider: {
      contributorId: CONTEXT_CONTRIBUTOR_IDS.relatedEntities,
      sections: ['relatedEntities'],
      async contribute() {
        relatedProviderCalled = true;
        throw new Error('related provider should not be called after authorization failure');
      },
      async contributeWithMetadata() {
        relatedProviderCalled = true;
        throw new Error('related provider should not be called after authorization failure');
      },
    } as never,
  });

  await assert.rejects(
    () =>
      useCase.execute(ASSEMBLE_CONTEXT, {
        capabilityId: PROJECT_INTELLIGENCE_V0_CAPABILITY_ID,
        request: projectRequest(),
      }),
    AuthorizationDeniedError,
  );

  assert.equal(primaryProviderCalled, false);
  assert.equal(relatedProviderCalled, false);
});

test('cross-organization primary entity is treated as not found', async () => {
  const useCase = createAssembleContextUseCase({
    projects: new InMemoryProjectRepository([projectFixture()]),
    milestones: new InMemoryMilestoneRepository([]),
    tasks: new InMemoryTaskRepository([]),
    events: new InMemoryEventRepository([]),
  });

  await assert.rejects(
    () =>
      useCase.execute(ASSEMBLE_CONTEXT, {
        capabilityId: PROJECT_INTELLIGENCE_V0_CAPABILITY_ID,
        request: projectRequest({
          primaryEntity: {
            organizationId: OTHER_ORGANIZATION_ID,
            entityType: 'Project',
            entityId: PROJECT_ID,
          },
        }),
      }),
    (error: unknown) => {
      assert.ok(error instanceof ApplicationError);
      assert.equal(error.code, 'NOT_FOUND');
      return true;
    },
  );
});

test('primary entity not found fails assembly', async () => {
  const useCase = createAssembleContextUseCase({
    projects: new InMemoryProjectRepository([]),
    milestones: new InMemoryMilestoneRepository([]),
    tasks: new InMemoryTaskRepository([]),
    events: new InMemoryEventRepository([]),
  });

  await assert.rejects(
    () =>
      useCase.execute(ASSEMBLE_CONTEXT, {
        capabilityId: PROJECT_INTELLIGENCE_V0_CAPABILITY_ID,
        request: projectRequest(),
      }),
    (error: unknown) => {
      assert.ok(error instanceof ApplicationError);
      assert.equal(error.code, 'NOT_FOUND');
      return true;
    },
  );
});

test('capability and entity-type mismatch is rejected', async () => {
  const useCase = createAssembleContextUseCase({
    projects: new InMemoryProjectRepository([projectFixture()]),
    milestones: new InMemoryMilestoneRepository([]),
    tasks: new InMemoryTaskRepository([]),
    events: new InMemoryEventRepository([]),
  });

  await assert.rejects(
    () =>
      useCase.execute(ASSEMBLE_CONTEXT, {
        capabilityId: MILESTONE_INTELLIGENCE_V0_CAPABILITY_ID,
        request: projectRequest(),
      }),
    (error: unknown) => {
      assert.ok(error instanceof ApplicationError);
      assert.equal(error.code, 'VALIDATION_FAILED');
      return true;
    },
  );
});

test('scope resolution is deterministic from capability definition', () => {
  const scope = resolveContextScope({
    organizationId: ORGANIZATION_ID,
    request: projectRequest(),
    capability: PROJECT_INTELLIGENCE_V0,
  });

  assert.deepEqual(scope.includeDescendants, ['Milestone']);
  assert.equal(scope.eventLookbackPerAggregate, 25);
  assert.equal(scope.maxContributions, 100);
});

test('milestone capability scope includes Task descendants only', () => {
  const scope = resolveContextScope({
    organizationId: ORGANIZATION_ID,
    request: milestoneRequest(),
    capability: MILESTONE_INTELLIGENCE_V0,
  });

  assert.deepEqual(scope.includeDescendants, ['Task']);
});

test('related entities are ordered deterministically by name then id', async () => {
  const useCase = createAssembleContextUseCase({
    projects: new InMemoryProjectRepository([projectFixture()]),
    milestones: new InMemoryMilestoneRepository([
      milestoneFixture({ id: MILESTONE_B_ID, name: 'Beta Milestone' }),
      milestoneFixture({ name: 'Alpha Milestone' }),
    ]),
    tasks: new InMemoryTaskRepository([]),
    events: new InMemoryEventRepository([]),
  });

  const { contextPackage } = await useCase.execute(ASSEMBLE_CONTEXT, {
    capabilityId: PROJECT_INTELLIGENCE_V0_CAPABILITY_ID,
    request: projectRequest(),
  });

  const entities = contextPackage.relatedEntities[0]?.payload.entities as Array<{ name: string }>;
  assert.deepEqual(
    entities.map((entity) => entity.name),
    ['Alpha Milestone', 'Beta Milestone'],
  );
});

test('empty related entities and empty event payloads remain valid', async () => {
  const useCase = createAssembleContextUseCase({
    projects: new InMemoryProjectRepository([projectFixture()]),
    milestones: new InMemoryMilestoneRepository([]),
    tasks: new InMemoryTaskRepository([]),
    events: new InMemoryEventRepository([]),
  });

  const { contextPackage } = await useCase.execute(ASSEMBLE_CONTEXT, {
    capabilityId: PROJECT_INTELLIGENCE_V0_CAPABILITY_ID,
    request: projectRequest(),
  });

  assert.equal(contextPackage.relatedEntities.length, 0);
  assert.equal(contextPackage.events.length, 1);
  assert.equal(
    (contextPackage.events[0]?.payload.events as readonly unknown[]).length,
    0,
  );
});

test('unavailable organizational memory degrades confidence and completeness', async () => {
  const useCase = createAssembleContextUseCase({
    projects: new InMemoryProjectRepository([projectFixture()]),
    milestones: new InMemoryMilestoneRepository([]),
    tasks: new InMemoryTaskRepository([]),
    events: new InMemoryEventRepository([]),
  });

  const { contextPackage } = await useCase.execute(ASSEMBLE_CONTEXT, {
    capabilityId: PROJECT_INTELLIGENCE_V0_CAPABILITY_ID,
    request: projectRequest(),
  });

  assert.equal(contextPackage.organizationalMemory.length, 0);
  assert.equal(contextPackage.confidence.level, 'medium');
  assert.ok(
    contextPackage.confidence.factors.some(
      (factor) => factor.code === 'organizationalMemoryUnavailable',
    ),
  );
  assert.ok(
    !contextPackage.confidence.factors.some(
      (factor) => factor.code === 'organizationalMemoryEmpty',
    ),
  );
  assert.equal(contextPackage.completeness.status, 'degraded');
  assert.ok(
    contextPackage.completeness.degradationNotes.some((note) =>
      note.includes('Organizational Memory is unavailable'),
    ),
  );
});

test('available organizational memory with zero entries is empty not unavailable', async () => {
  const emptyMemoryProvider: OrganizationalMemoryProvider = {
    contributorId: CONTEXT_CONTRIBUTOR_IDS.organizationalMemory,
    sections: ['organizationalMemory'],
    async contribute() {
      return [];
    },
    async retrieve() {
      return { status: 'available', contributions: [] };
    },
  };

  const baseDependencies = createAssembleContextDependencies({
    projects: new InMemoryProjectRepository([projectFixture()]),
    milestones: new InMemoryMilestoneRepository([]),
    tasks: new InMemoryTaskRepository([]),
    events: new InMemoryEventRepository([]),
  });

  const useCase = new AssembleContextUseCase({
    ...baseDependencies,
    organizationalMemoryProvider: emptyMemoryProvider,
  });

  const { contextPackage } = await useCase.execute(ASSEMBLE_CONTEXT, {
    capabilityId: PROJECT_INTELLIGENCE_V0_CAPABILITY_ID,
    request: projectRequest(),
  });

  assert.equal(contextPackage.organizationalMemory.length, 0);
  assert.ok(
    contextPackage.confidence.factors.some(
      (factor) => factor.code === 'organizationalMemoryEmpty',
    ),
  );
  assert.ok(
    !contextPackage.confidence.factors.some(
      (factor) => factor.code === 'organizationalMemoryUnavailable',
    ),
  );
  assert.ok(
    contextPackage.completeness.degradationNotes.some((note) =>
      note.includes('Organizational Memory is empty'),
    ),
  );
});

test('permission-restricted related entities lower confidence deterministically', () => {
  const confidence = assessConfidence({
    capability: PROJECT_INTELLIGENCE_V0,
    relatedEntities: [],
    events: [],
    organizationalMemory: [],
    relatedEntitiesPermissionRestricted: true,
    relatedEntitiesExpected: true,
    organizationalMemoryRequested: false,
    organizationalMemoryUnavailable: false,
    relatedEntitiesTruncated: false,
  });

  assert.equal(confidence.level, 'medium');
  assert.ok(
    confidence.factors.some((factor) => factor.code === 'permissionRestrictedSlice'),
  );
});

test('optional provider failure degrades completeness without inventing data', async () => {
  const clock = new FixedClock(NOW);
  const failingEventsProvider: ContextProvider = {
    contributorId: CONTEXT_CONTRIBUTOR_IDS.events,
    sections: ['events'],
    async contribute() {
      throw new Error('event provider unavailable');
    },
  };

  const baseDependencies = createAssembleContextDependencies({
    projects: new InMemoryProjectRepository([projectFixture()]),
    milestones: new InMemoryMilestoneRepository([]),
    tasks: new InMemoryTaskRepository([]),
    events: new InMemoryEventRepository([]),
    clock,
  });

  const useCase = new AssembleContextUseCase({
    ...baseDependencies,
    aggregateEventProvider: failingEventsProvider as never,
  });

  const { contextPackage } = await useCase.execute(ASSEMBLE_CONTEXT, {
    capabilityId: PROJECT_INTELLIGENCE_V0_CAPABILITY_ID,
    request: projectRequest(),
  });

  assert.equal(contextPackage.events.length, 0);
  assert.equal(contextPackage.completeness.status, 'degraded');
  assert.ok(contextPackage.completeness.degradationNotes.length > 0);
});

test('required primary provider failure aborts assembly', async () => {
  const clock = new FixedClock(NOW);
  const failingPrimaryProvider: ContextProvider = {
    contributorId: CONTEXT_CONTRIBUTOR_IDS.primaryEntity,
    sections: ['primaryEntity'],
    async contribute() {
      throw new ApplicationError({
        code: 'NOT_FOUND',
        message: 'The requested project was not found.',
      });
    },
  };

  const baseDependencies = createAssembleContextDependencies({
    projects: new InMemoryProjectRepository([projectFixture()]),
    milestones: new InMemoryMilestoneRepository([]),
    tasks: new InMemoryTaskRepository([]),
    events: new InMemoryEventRepository([]),
    clock,
  });

  const useCase = new AssembleContextUseCase({
    ...baseDependencies,
    primaryEntityProvider: failingPrimaryProvider as never,
  });

  await assert.rejects(
    () =>
      useCase.execute(ASSEMBLE_CONTEXT, {
        capabilityId: PROJECT_INTELLIGENCE_V0_CAPABILITY_ID,
        request: projectRequest(),
      }),
    (error: unknown) => {
      assert.ok(error instanceof ApplicationError);
      assert.equal(error.code, 'NOT_FOUND');
      return true;
    },
  );
});

test('malformed provider contribution is rejected', async () => {
  const clock = new FixedClock(NOW);
  const malformedPrimaryProvider: ContextProvider = {
    contributorId: CONTEXT_CONTRIBUTOR_IDS.primaryEntity,
    sections: ['primaryEntity'],
    async contribute() {
      return [
        {
          contributorId: CONTEXT_CONTRIBUTOR_IDS.primaryEntity,
          section: 'primaryEntity',
          subject: null,
          payload: { invalid: Symbol('secret') },
          provenance: {
            sourceSystem: 'synaptria.operational',
            sourceType: 'Project',
            retrievalMethod: 'repository.read',
            retrievedAt: NOW,
            permissionScope: ['projects.read'],
          },
        },
      ] as unknown as ContextContribution[];
    },
  };

  const baseDependencies = createAssembleContextDependencies({
    projects: new InMemoryProjectRepository([projectFixture()]),
    milestones: new InMemoryMilestoneRepository([]),
    tasks: new InMemoryTaskRepository([]),
    events: new InMemoryEventRepository([]),
    clock,
  });

  const useCase = new AssembleContextUseCase({
    ...baseDependencies,
    primaryEntityProvider: malformedPrimaryProvider as never,
  });

  await assert.rejects(
    () =>
      useCase.execute(ASSEMBLE_CONTEXT, {
        capabilityId: PROJECT_INTELLIGENCE_V0_CAPABILITY_ID,
        request: projectRequest(),
      }),
    (error: unknown) => {
      assert.ok(error instanceof ApplicationError);
      assert.equal(error.code, 'VALIDATION_FAILED');
      return true;
    },
  );
});

test('provenance is produced for every contribution', async () => {
  const useCase = createAssembleContextUseCase({
    projects: new InMemoryProjectRepository([projectFixture()]),
    milestones: new InMemoryMilestoneRepository([milestoneFixture()]),
    tasks: new InMemoryTaskRepository([]),
    events: new InMemoryEventRepository([domainEventFixture()]),
  });

  const { contextPackage } = await useCase.execute(ASSEMBLE_CONTEXT, {
    capabilityId: PROJECT_INTELLIGENCE_V0_CAPABILITY_ID,
    request: projectRequest(),
  });

  assert.ok(contextPackage.provenance.length >= 3);
  assert.ok(contextPackage.primaryEntity.provenance.retrievedAt instanceof Date);
});

test('stable serialization is deterministic for repeated assembly', async () => {
  const harnessInput = {
    projects: new InMemoryProjectRepository([projectFixture()]),
    milestones: new InMemoryMilestoneRepository([
      milestoneFixture({ id: MILESTONE_B_ID, name: 'Beta Milestone' }),
      milestoneFixture(),
    ]),
    tasks: new InMemoryTaskRepository([]),
    events: new InMemoryEventRepository([domainEventFixture()]),
    clock: new FixedClock(NOW),
    packageId: 'package-1',
  };

  const useCase = createAssembleContextUseCase(harnessInput);
  const first = await useCase.execute(ASSEMBLE_CONTEXT, {
    capabilityId: PROJECT_INTELLIGENCE_V0_CAPABILITY_ID,
    request: projectRequest(),
  });
  const second = await useCase.execute(ASSEMBLE_CONTEXT, {
    capabilityId: PROJECT_INTELLIGENCE_V0_CAPABILITY_ID,
    request: projectRequest(),
  });

  assert.equal(serializeContextPackageJson(first.contextPackage), serializeContextPackageJson(second.contextPackage));
});

function testProjectCapability(overrides: Partial<ContextCapabilityDefinition> = {}): ContextCapabilityDefinition {
  return {
    ...PROJECT_INTELLIGENCE_V0,
    ...overrides,
  };
}

test('enforceContributionBudget retains primary slot and truncates optional sections deterministically', () => {
  const contribution = (section: ContextContribution['section'], index: number): ContextContribution =>
    ({
      contributorId: CONTEXT_CONTRIBUTOR_IDS.relatedEntities,
      section,
      subject: null,
      payload: { index },
      provenance: {
        sourceSystem: 'synaptria.operational',
        sourceType: 'Project',
        retrievalMethod: 'repository.read',
        retrievedAt: NOW,
        permissionScope: ['projects.read'],
      },
    }) as ContextContribution;

  const related = [contribution('relatedEntities', 1), contribution('relatedEntities', 2)];
  const events = [contribution('events', 1), contribution('events', 2)];
  const memory = [contribution('organizationalMemory', 1)];

  const result = enforceContributionBudget({
    maxContributions: 4,
    relatedEntities: related,
    events,
    organizationalMemory: memory,
  });

  assert.equal(result.relatedEntities.length, 2);
  assert.equal(result.events.length, 1);
  assert.equal(result.organizationalMemory.length, 0);
  assert.equal(result.truncatedContributionCount, 2);
  assert.equal(result.relatedEntitiesTruncated, false);
  assert.equal(result.eventsTruncated, true);
  assert.equal(result.organizationalMemoryTruncated, true);
});

test('maxContributions limits final context package contribution count', async () => {
  const milestones = Array.from({ length: 6 }, (_, index) =>
    milestoneFixture({
      id: identifier(`milestone-${index + 1}`, 'MilestoneId'),
      name: `Milestone ${index + 1}`,
    }),
  );

  const baseDependencies = createAssembleContextDependencies({
    projects: new InMemoryProjectRepository([projectFixture()]),
    milestones: new InMemoryMilestoneRepository(milestones),
    tasks: new InMemoryTaskRepository([]),
    events: new InMemoryEventRepository([domainEventFixture()]),
    clock: new FixedClock(NOW),
    packageId: 'package-budget',
  });

  const constrainedCapability = testProjectCapability({ maxContributions: 4 });

  const useCase = new AssembleContextUseCase({
    ...baseDependencies,
    resolveCapabilityDefinition: (capabilityId) =>
      capabilityId === PROJECT_INTELLIGENCE_V0_CAPABILITY_ID ? constrainedCapability : null,
  });

  const run = () =>
    useCase.execute(ASSEMBLE_CONTEXT, {
      capabilityId: PROJECT_INTELLIGENCE_V0_CAPABILITY_ID,
      request: projectRequest(),
    });

  const first = await run();
  const second = await run();

  const totalContributions =
    1 +
    first.contextPackage.relatedEntities.length +
    first.contextPackage.events.length +
    first.contextPackage.organizationalMemory.length;

  assert.equal(totalContributions, 4);
  assert.equal(first.contextPackage.relatedEntities.length, 1);
  assert.equal(first.contextPackage.events.length, 2);
  assert.ok(first.contextPackage.primaryEntity.payload.name, 'Alpha Study');
  assert.equal(first.contextPackage.completeness.status, 'degraded');
  assert.ok(
    first.contextPackage.completeness.degradationNotes.some((note) =>
      note.includes('maxContributions'),
    ),
  );
  assert.equal(
    serializeContextPackageJson(first.contextPackage),
    serializeContextPackageJson(second.contextPackage),
  );
});

test('eventLookbackPerAggregate is passed to EventRepository and limits returned events', async () => {
  const projectEvents = Array.from({ length: 5 }, (_, index) =>
    domainEventFixture({
      id: identifier(`event-${index + 1}`, 'DomainEventId'),
      eventType: 'project.updated',
      occurredAt: new Date(`2026-07-26T1${index}:00:00.000Z`),
    }),
  );

  const events = new SpyEventRepository(projectEvents);
  const constrainedCapability = testProjectCapability({ eventLookbackPerAggregate: 2 });

  const useCase = new AssembleContextUseCase({
    ...createAssembleContextDependencies({
      projects: new InMemoryProjectRepository([projectFixture()]),
      milestones: new InMemoryMilestoneRepository([]),
      tasks: new InMemoryTaskRepository([]),
      events,
    }),
    resolveCapabilityDefinition: (capabilityId) =>
      capabilityId === PROJECT_INTELLIGENCE_V0_CAPABILITY_ID ? constrainedCapability : null,
  });

  const { contextPackage } = await useCase.execute(ASSEMBLE_CONTEXT, {
    capabilityId: PROJECT_INTELLIGENCE_V0_CAPABILITY_ID,
    request: projectRequest(),
  });

  assert.ok(events.aggregateQueries.length >= 1);
  assert.ok(
    events.aggregateQueries.every((query) => query.limit === 2),
    'every aggregate query should use the configured lookback limit',
  );

  const projectEventContribution = contextPackage.events.find(
    (contribution) => contribution.subject?.entityType === 'Project',
  );
  assert.ok(projectEventContribution);
  assert.equal(
    (projectEventContribution.payload.events as readonly unknown[]).length,
    2,
  );
});
