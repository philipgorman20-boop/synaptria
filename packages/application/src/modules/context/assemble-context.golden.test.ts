import assert from 'node:assert/strict';
import test from 'node:test';

import { FixedClock, identifier } from '@synaptria/core';
import { serializeContextPackageJson } from '@synaptria/domain/context';

import {
  MILESTONE_INTELLIGENCE_V0_CAPABILITY_ID,
  PROJECT_INTELLIGENCE_V0_CAPABILITY_ID,
} from './capabilities/registry';
import {
  CORRELATION_ID,
  MEMBERSHIP_ID,
  MILESTONE_B_ID,
  MILESTONE_ID,
  NOW,
  ORGANIZATION_ID,
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
} from './testing/fixtures';
import { createAssembleContextUseCase } from './testing/test-harness';

const ASSEMBLE_CONTEXT = {
  userId: USER_ID,
  organizationId: ORGANIZATION_ID,
  membershipId: MEMBERSHIP_ID,
  role: 'MEMBER' as const,
  requestId: REQUEST_ID,
  correlationId: CORRELATION_ID,
};

test('project capability golden JSON remains stable', async () => {
  const useCase = createAssembleContextUseCase({
    projects: new InMemoryProjectRepository([projectFixture()]),
    milestones: new InMemoryMilestoneRepository([
      milestoneFixture({ id: MILESTONE_B_ID, name: 'Beta Milestone' }),
      milestoneFixture({ name: 'Alpha Milestone' }),
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
    clock: new FixedClock(NOW),
    packageId: 'package-golden-project',
  });

  const { contextPackage } = await useCase.execute(ASSEMBLE_CONTEXT, {
    capabilityId: PROJECT_INTELLIGENCE_V0_CAPABILITY_ID,
    request: {
      primaryEntity: {
        organizationId: ORGANIZATION_ID,
        entityType: 'Project',
        entityId: PROJECT_ID,
      },
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
    },
  });

  const serialized = serializeContextPackageJson(contextPackage);
  const repeated = serializeContextPackageJson(
    (
      await useCase.execute(ASSEMBLE_CONTEXT, {
        capabilityId: PROJECT_INTELLIGENCE_V0_CAPABILITY_ID,
        request: {
          primaryEntity: {
            organizationId: ORGANIZATION_ID,
            entityType: 'Project',
            entityId: PROJECT_ID,
          },
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
        },
      })
    ).contextPackage,
  );

  assert.equal(serialized, repeated);
  assert.match(serialized, /"packageId":"package-golden-project"/);
  assert.match(serialized, /"name":"Alpha Study"/);
  assert.match(serialized, /"Alpha Milestone"/);
  assert.match(serialized, /"deterministic":true/);
  assert.match(serialized, /"organizationalMemoryUnavailable"/);
});

test('milestone capability golden JSON remains stable', async () => {
  const useCase = createAssembleContextUseCase({
    projects: new InMemoryProjectRepository([projectFixture()]),
    milestones: new InMemoryMilestoneRepository([milestoneFixture()]),
    tasks: new InMemoryTaskRepository([
      taskFixture({ id: TASK_B_ID, name: 'Beta Task' }),
      taskFixture({ name: 'Alpha Task' }),
    ]),
    events: new InMemoryEventRepository([
      domainEventFixture({
        aggregateType: 'Milestone',
        aggregateId: MILESTONE_ID,
        eventType: 'milestone.created',
      }),
    ]),
    clock: new FixedClock(NOW),
    packageId: 'package-golden-milestone',
  });

  const { contextPackage } = await useCase.execute(ASSEMBLE_CONTEXT, {
    capabilityId: MILESTONE_INTELLIGENCE_V0_CAPABILITY_ID,
    request: {
      primaryEntity: {
        organizationId: ORGANIZATION_ID,
        entityType: 'Milestone',
        entityId: MILESTONE_ID,
      },
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
    },
  });

  const serialized = serializeContextPackageJson(contextPackage);

  assert.match(serialized, /"packageId":"package-golden-milestone"/);
  assert.match(serialized, /"Protocol Draft"/);
  assert.match(serialized, /"Alpha Task"/);
  assert.match(serialized, /"eventsIncluded"/);
});
