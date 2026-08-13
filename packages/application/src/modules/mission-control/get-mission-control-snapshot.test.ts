import assert from 'node:assert/strict';
import test from 'node:test';

import { FixedClock, identifier } from '@synaptria/core';
import { AuthorizationDeniedError } from '@synaptria/core/errors';
import type { DomainEventId } from '@synaptria/events';

import { ListRecentOrganizationEventsUseCase } from '../events/list-recent-organization-events';
import type { MissionControlAccessPolicy } from './access-policy';
import { MISSION_CONTROL_RECENT_ACTIVITY_LIMIT } from './constants';
import {
  GetMissionControlSnapshotUseCase,
} from './get-mission-control-snapshot';
import { MissionControlService } from './mission-control-service';
import {
  domainEventFixture,
  InMemoryEventRepository,
  InMemoryMilestoneRepository,
  InMemoryProgramRepository,
  InMemoryProjectRepository,
  InMemoryTaskRepository,
  MISSION_CONTROL_CONTEXT,
  MILESTONE_B_ID,
  MILESTONE_ID,
  NOW,
  ORGANIZATION_ID,
  OTHER_ORGANIZATION_ID,
  PROJECT_B_ID,
  PROJECT_ID,
  programFixture,
  projectFixture,
  milestoneFixture,
  taskFixture,
  TASK_B_ID,
  TASK_ID,
} from './testing/fixtures';

const CLOCK = new FixedClock(NOW);
const YESTERDAY = new Date('2026-07-25T12:00:00.000Z');
const DEEPLY_OVERDUE = new Date('2026-07-10T12:00:00.000Z');
const DUE_SOON = new Date('2026-07-30T12:00:00.000Z');
const LATER = new Date('2026-08-20T12:00:00.000Z');

function createUseCaseFromFixtures(input: {
  readonly programs?: ReturnType<typeof programFixture>[];
  readonly projects?: ReturnType<typeof projectFixture>[];
  readonly milestones?: ReturnType<typeof milestoneFixture>[];
  readonly tasks?: ReturnType<typeof taskFixture>[];
  readonly events?: ReturnType<typeof domainEventFixture>[];
  readonly accessPolicy?: MissionControlAccessPolicy;
}) {
  const events = new InMemoryEventRepository(input.events ?? []);
  return new GetMissionControlSnapshotUseCase({
    programs: new InMemoryProgramRepository(input.programs ?? []),
    projects: new InMemoryProjectRepository(input.projects ?? []),
    milestones: new InMemoryMilestoneRepository(input.milestones ?? []),
    tasks: new InMemoryTaskRepository(input.tasks ?? []),
    listRecentOrganizationEvents: new ListRecentOrganizationEventsUseCase(events),
    clock: CLOCK,
    ...(input.accessPolicy === undefined ? {} : { accessPolicy: input.accessPolicy }),
  });
}

test('empty organization returns zeroed summary and empty collections', async () => {
  const useCase = createUseCaseFromFixtures({});
  const snapshot = await useCase.execute(MISSION_CONTROL_CONTEXT);

  assert.deepEqual(snapshot.summary, {
    activePrograms: 0,
    activeProjects: 0,
    openMilestones: 0,
    openTasks: 0,
    overdueMilestones: 0,
    overdueTasks: 0,
    blockedTasks: 0,
    completedTasks: 0,
    recentActivityCount: 0,
  });
  assert.equal(snapshot.attentionItems.length, 0);
  assert.equal(snapshot.projectHealth.length, 0);
  assert.equal(snapshot.recentActivity.length, 0);
});

test('summary counts reflect active and open entities', async () => {
  const useCase = createUseCaseFromFixtures({
    programs: [
      programFixture(),
      programFixture({
        id: identifier('program-2', 'ProgramId'),
        name: 'Completed Program',
        status: 'COMPLETED',
      }),
    ],
    projects: [
      projectFixture(),
      projectFixture({
        id: PROJECT_B_ID,
        name: 'Beta Study',
        status: 'PLANNED',
      }),
    ],
    milestones: [milestoneFixture()],
    tasks: [
      taskFixture(),
      taskFixture({
        id: TASK_B_ID,
        name: 'Done task',
        status: 'COMPLETED',
      }),
    ],
  });

  const snapshot = await useCase.execute(MISSION_CONTROL_CONTEXT);

  assert.equal(snapshot.summary.activePrograms, 1);
  assert.equal(snapshot.summary.activeProjects, 1);
  assert.equal(snapshot.summary.openMilestones, 1);
  assert.equal(snapshot.summary.openTasks, 1);
  assert.equal(snapshot.summary.completedTasks, 1);
});

test('overdue milestone appears in attention items and summary', async () => {
  const useCase = createUseCaseFromFixtures({
    projects: [projectFixture()],
    milestones: [
      milestoneFixture({
        plannedEndDate: YESTERDAY,
      }),
    ],
  });

  const snapshot = await useCase.execute(MISSION_CONTROL_CONTEXT);

  assert.equal(snapshot.summary.overdueMilestones, 1);
  assert.ok(
    snapshot.attentionItems.some((item) => item.type === 'overdue_milestone'),
  );
  assert.equal(snapshot.milestoneSignals[0]?.overdue, true);
});

test('due-soon milestone appears with medium severity', async () => {
  const useCase = createUseCaseFromFixtures({
    projects: [projectFixture()],
    milestones: [
      milestoneFixture({
        plannedEndDate: DUE_SOON,
      }),
    ],
  });

  const snapshot = await useCase.execute(MISSION_CONTROL_CONTEXT);
  const item = snapshot.attentionItems.find(
    (entry) => entry.type === 'milestone_due_soon',
  );

  assert.ok(item);
  assert.equal(item.severity, 'medium');
  assert.equal(snapshot.milestoneSignals[0]?.dueSoon, true);
});

test('overdue task appears in attention items and summary', async () => {
  const useCase = createUseCaseFromFixtures({
    projects: [projectFixture()],
    milestones: [milestoneFixture()],
    tasks: [
      taskFixture({
        plannedEndDate: YESTERDAY,
      }),
    ],
  });

  const snapshot = await useCase.execute(MISSION_CONTROL_CONTEXT);

  assert.equal(snapshot.summary.overdueTasks, 1);
  assert.ok(snapshot.attentionItems.some((item) => item.type === 'overdue_task'));
});

test('due-soon task appears with medium severity', async () => {
  const useCase = createUseCaseFromFixtures({
    projects: [projectFixture()],
    milestones: [milestoneFixture()],
    tasks: [
      taskFixture({
        plannedEndDate: DUE_SOON,
      }),
    ],
  });

  const snapshot = await useCase.execute(MISSION_CONTROL_CONTEXT);
  const item = snapshot.attentionItems.find((entry) => entry.type === 'task_due_soon');

  assert.ok(item);
  assert.equal(item.severity, 'medium');
});

test('blocked task appears in attention and summary counts', async () => {
  const useCase = createUseCaseFromFixtures({
    projects: [projectFixture()],
    milestones: [milestoneFixture()],
    tasks: [
      taskFixture({
        status: 'BLOCKED',
      }),
    ],
  });

  const snapshot = await useCase.execute(MISSION_CONTROL_CONTEXT);

  assert.equal(snapshot.summary.blockedTasks, 1);
  assert.ok(snapshot.attentionItems.some((item) => item.type === 'blocked_task'));
  assert.equal(snapshot.taskSignals[0]?.blocked, true);
});

test('completed tasks are excluded from open counts', async () => {
  const useCase = createUseCaseFromFixtures({
    projects: [projectFixture()],
    milestones: [milestoneFixture()],
    tasks: [
      taskFixture({ status: 'COMPLETED' }),
      taskFixture({
        id: TASK_B_ID,
        status: 'TODO',
      }),
    ],
  });

  const snapshot = await useCase.execute(MISSION_CONTROL_CONTEXT);

  assert.equal(snapshot.summary.openTasks, 1);
  assert.equal(snapshot.summary.completedTasks, 1);
  assert.equal(snapshot.taskSignals.length, 1);
});

test('project health aggregates milestone and task signals', async () => {
  const useCase = createUseCaseFromFixtures({
    projects: [projectFixture()],
    milestones: [
      milestoneFixture({ plannedEndDate: YESTERDAY }),
      milestoneFixture({
        id: MILESTONE_B_ID,
        name: 'Beta Milestone',
        plannedEndDate: DUE_SOON,
      }),
    ],
    tasks: [
      taskFixture({ status: 'BLOCKED' }),
      taskFixture({
        id: TASK_B_ID,
        plannedEndDate: YESTERDAY,
      }),
    ],
  });

  const snapshot = await useCase.execute(MISSION_CONTROL_CONTEXT);
  const health = snapshot.projectHealth[0];

  assert.ok(health);
  assert.equal(health.openMilestones, 2);
  assert.equal(health.overdueMilestones, 1);
  assert.equal(health.openTasks, 2);
  assert.equal(health.overdueTasks, 1);
  assert.equal(health.blockedTasks, 1);
});

test('project severity escalates for overdue and blocked work', async () => {
  const useCase = createUseCaseFromFixtures({
    projects: [projectFixture()],
    milestones: [
      milestoneFixture({
        plannedEndDate: DEEPLY_OVERDUE,
      }),
    ],
    tasks: [
      taskFixture({
        status: 'BLOCKED',
        plannedEndDate: YESTERDAY,
      }),
    ],
  });

  const snapshot = await useCase.execute(MISSION_CONTROL_CONTEXT);

  assert.equal(snapshot.projectHealth[0]?.attentionSeverity, 'critical');
  assert.equal(snapshot.projectHealth[0]?.healthState, 'at_risk');
});

test('attention items are ordered deterministically by severity then type', async () => {
  const useCase = createUseCaseFromFixtures({
    projects: [projectFixture()],
    milestones: [
      milestoneFixture({
        name: 'Soon Milestone',
        plannedEndDate: DUE_SOON,
      }),
      milestoneFixture({
        id: MILESTONE_B_ID,
        name: 'Overdue Milestone',
        plannedEndDate: YESTERDAY,
      }),
    ],
    tasks: [
      taskFixture({
        name: 'Blocked Task',
        status: 'BLOCKED',
      }),
    ],
    events: [
      domainEventFixture({
        id: identifier('event-1', 'DomainEventId') as DomainEventId,
        eventType: 'project.updated',
      }),
    ],
  });

  const snapshot = await useCase.execute(MISSION_CONTROL_CONTEXT);
  const severities = snapshot.attentionItems.map((item) => item.severity);

  assert.deepEqual(severities, ['high', 'high', 'medium', 'low']);
});

test('projects are ordered deterministically by name then id', async () => {
  const useCase = createUseCaseFromFixtures({
    projects: [
      projectFixture({ id: PROJECT_B_ID, name: 'Beta Study' }),
      projectFixture({ name: 'Alpha Study' }),
    ],
  });

  const snapshot = await useCase.execute(MISSION_CONTROL_CONTEXT);

  assert.deepEqual(
    snapshot.projectHealth.map((entry) => entry.projectName),
    ['Alpha Study', 'Beta Study'],
  );
});

test('milestones are ordered with overdue first then planned end date', async () => {
  const useCase = createUseCaseFromFixtures({
    projects: [projectFixture()],
    milestones: [
      milestoneFixture({
        name: 'Later Milestone',
        plannedEndDate: LATER,
      }),
      milestoneFixture({
        id: MILESTONE_B_ID,
        name: 'Overdue Milestone',
        plannedEndDate: YESTERDAY,
      }),
    ],
  });

  const snapshot = await useCase.execute(MISSION_CONTROL_CONTEXT);

  assert.equal(snapshot.milestoneSignals[0]?.milestoneName, 'Overdue Milestone');
  assert.equal(snapshot.milestoneSignals[1]?.milestoneName, 'Later Milestone');
});

test('tasks are ordered with overdue and blocked before due-later tasks', async () => {
  const useCase = createUseCaseFromFixtures({
    projects: [projectFixture()],
    milestones: [milestoneFixture()],
    tasks: [
      taskFixture({
        id: TASK_B_ID,
        name: 'Later Task',
        plannedEndDate: LATER,
      }),
      taskFixture({
        name: 'Overdue Task',
        plannedEndDate: YESTERDAY,
      }),
    ],
  });

  const snapshot = await useCase.execute(MISSION_CONTROL_CONTEXT);

  assert.equal(snapshot.taskSignals[0]?.taskName, 'Overdue Task');
  assert.equal(snapshot.taskSignals[1]?.taskName, 'Later Task');
});

test('recent events are integrated through ListRecentOrganizationEventsUseCase', async () => {
  const events = new InMemoryEventRepository([
    domainEventFixture(),
    domainEventFixture({
      id: identifier('event-2', 'DomainEventId') as DomainEventId,
      eventType: 'milestone.created',
      aggregateType: 'Milestone',
      aggregateId: MILESTONE_ID,
    }),
  ]);
  const useCase = new GetMissionControlSnapshotUseCase({
    programs: new InMemoryProgramRepository([]),
    projects: new InMemoryProjectRepository([projectFixture()]),
    milestones: new InMemoryMilestoneRepository([]),
    tasks: new InMemoryTaskRepository([]),
    listRecentOrganizationEvents: new ListRecentOrganizationEventsUseCase(events),
    clock: CLOCK,
  });

  const snapshot = await useCase.execute(MISSION_CONTROL_CONTEXT);

  assert.equal(snapshot.recentActivity.length, 2);
  assert.equal(snapshot.summary.recentActivityCount, 2);
  assert.equal(events.listRecentQueries.length, 1);
  assert.equal(events.listRecentQueries[0]?.organizationId, ORGANIZATION_ID);
});

test('recent activity uses the dashboard recent-event limit', async () => {
  const events = new InMemoryEventRepository([]);
  const useCase = new GetMissionControlSnapshotUseCase({
    programs: new InMemoryProgramRepository([]),
    projects: new InMemoryProjectRepository([]),
    milestones: new InMemoryMilestoneRepository([]),
    tasks: new InMemoryTaskRepository([]),
    listRecentOrganizationEvents: new ListRecentOrganizationEventsUseCase(events),
    clock: CLOCK,
  });

  await useCase.execute(MISSION_CONTROL_CONTEXT);

  assert.equal(events.listRecentQueries[0]?.limit, MISSION_CONTROL_RECENT_ACTIVITY_LIMIT);
});

test('snapshot reads are scoped to the trusted organization context', async () => {
  const useCase = createUseCaseFromFixtures({
    programs: [programFixture()],
    projects: [projectFixture()],
    milestones: [milestoneFixture()],
    tasks: [taskFixture()],
  });

  const snapshot = await useCase.execute(MISSION_CONTROL_CONTEXT);

  assert.equal(snapshot.organization.organizationId, ORGANIZATION_ID);
});

test('cross-tenant entities never appear in mission control output', async () => {
  const useCase = createUseCaseFromFixtures({
    programs: [
      programFixture(),
      programFixture({
        id: identifier('program-other', 'ProgramId'),
        organizationId: OTHER_ORGANIZATION_ID,
      }),
    ],
    projects: [
      projectFixture(),
      projectFixture({
        id: identifier('project-other', 'ProjectId'),
        organizationId: OTHER_ORGANIZATION_ID,
        name: 'Other Project',
        status: 'ACTIVE',
      }),
    ],
    milestones: [
      milestoneFixture(),
      milestoneFixture({
        id: identifier('milestone-other', 'MilestoneId'),
        organizationId: OTHER_ORGANIZATION_ID,
        projectId: identifier('project-other', 'ProjectId'),
      }),
    ],
    tasks: [
      taskFixture(),
      taskFixture({
        id: identifier('task-other', 'TaskId'),
        organizationId: OTHER_ORGANIZATION_ID,
        milestoneId: identifier('milestone-other', 'MilestoneId'),
      }),
    ],
    events: [
      domainEventFixture(),
      domainEventFixture({
        id: identifier('event-other', 'DomainEventId') as DomainEventId,
        organizationId: OTHER_ORGANIZATION_ID,
      }),
    ],
  });

  const snapshot = await useCase.execute(MISSION_CONTROL_CONTEXT);

  assert.equal(snapshot.summary.activePrograms, 1);
  assert.equal(snapshot.summary.activeProjects, 1);
  assert.equal(snapshot.summary.openMilestones, 1);
  assert.equal(snapshot.summary.openTasks, 1);
  assert.equal(snapshot.recentActivity.length, 1);
});

test('permission-restricted slices omit unauthorized data and record restriction', async () => {
  const accessPolicy: MissionControlAccessPolicy = {
    canAccessDashboard: () => true,
    canReadPrograms: () => true,
    canReadProjects: () => true,
    canReadMilestones: () => true,
    canReadTasks: () => false,
    canReadRecentActivity: () => true,
  };

  const useCase = createUseCaseFromFixtures({
    programs: [programFixture()],
    projects: [projectFixture()],
    milestones: [milestoneFixture()],
    tasks: [taskFixture({ status: 'BLOCKED', plannedEndDate: YESTERDAY })],
    events: [domainEventFixture()],
    accessPolicy,
  });

  const snapshot = await useCase.execute(MISSION_CONTROL_CONTEXT);

  assert.deepEqual(snapshot.metadata.restrictedSlices, ['tasks']);
  assert.equal(snapshot.summary.openTasks, 0);
  assert.equal(snapshot.summary.blockedTasks, 0);
  assert.equal(snapshot.taskSignals.length, 0);
  assert.ok(!snapshot.attentionItems.some((item) => item.entity.entityType === 'Task'));
});

test('fixed-clock repeatability returns equivalent snapshots', async () => {
  const useCase = createUseCaseFromFixtures({
    programs: [programFixture()],
    projects: [projectFixture()],
    milestones: [
      milestoneFixture({ plannedEndDate: YESTERDAY }),
      milestoneFixture({
        id: MILESTONE_B_ID,
        plannedEndDate: DUE_SOON,
      }),
    ],
    tasks: [
      taskFixture({ status: 'BLOCKED' }),
      taskFixture({
        id: TASK_B_ID,
        plannedEndDate: YESTERDAY,
      }),
    ],
    events: [domainEventFixture()],
  });

  const first = await useCase.execute(MISSION_CONTROL_CONTEXT);
  const second = await useCase.execute(MISSION_CONTROL_CONTEXT);

  assert.deepEqual(
    {
      summary: first.summary,
      attentionItems: first.attentionItems,
      projectHealth: first.projectHealth,
      milestoneSignals: first.milestoneSignals,
      taskSignals: first.taskSignals,
      recentActivity: first.recentActivity,
      metadata: first.metadata,
    },
    {
      summary: second.summary,
      attentionItems: second.attentionItems,
      projectHealth: second.projectHealth,
      milestoneSignals: second.milestoneSignals,
      taskSignals: second.taskSignals,
      recentActivity: second.recentActivity,
      metadata: second.metadata,
    },
  );
});

test('unauthorized dashboard access is rejected before assembly', async () => {
  const useCase = createUseCaseFromFixtures({
    accessPolicy: {
      canAccessDashboard: () => false,
      canReadPrograms: () => true,
      canReadProjects: () => true,
      canReadMilestones: () => true,
      canReadTasks: () => true,
      canReadRecentActivity: () => true,
    },
  });

  await assert.rejects(
    () => useCase.execute(MISSION_CONTROL_CONTEXT),
    AuthorizationDeniedError,
  );
});

test('MissionControlService delegates to the snapshot use case', async () => {
  const expected = { organization: { organizationId: ORGANIZATION_ID } };
  const service = new MissionControlService({
    async execute() {
      return expected as never;
    },
  } as never);

  const result = await service.getSnapshot(MISSION_CONTROL_CONTEXT);
  assert.equal(result, expected);
});
