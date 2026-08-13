import assert from 'node:assert/strict';
import test from 'node:test';

import { FixedClock, identifier } from '@synaptria/core';
import { AuthorizationDeniedError } from '@synaptria/core/errors';
import type { DomainEventId } from '@synaptria/events';

import { ListRecentOrganizationEventsUseCase } from '../events/list-recent-organization-events';
import type { MissionControlAccessPolicy } from '../mission-control/access-policy';
import { GetMissionControlSnapshotUseCase } from '../mission-control/get-mission-control-snapshot';
import { MissionControlService } from '../mission-control/mission-control-service';
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
  PROJECT_B_ID,
  PROJECT_ID,
  programFixture,
  projectFixture,
  milestoneFixture,
  taskFixture,
  TASK_B_ID,
  TASK_ID,
} from '../mission-control/testing/fixtures';
import {
  DAILY_BRIEFING_ATTENTION_LIMIT,
  DAILY_BRIEFING_DEFAULT_LOOKBACK_HOURS,
  DAILY_BRIEFING_PROJECT_HIGHLIGHT_LIMIT,
  DAILY_BRIEFING_RECENT_CHANGES_LIMIT,
} from './constants';
import { DailyBriefingService } from './daily-briefing-service';
import type { DailyBriefingAccessPolicy } from './access-policy';
import { GetDailyBriefingSnapshotUseCase } from './get-daily-briefing-snapshot';

const CLOCK = new FixedClock(NOW);
const YESTERDAY = new Date('2026-07-25T12:00:00.000Z');
const BEFORE_WINDOW = new Date('2026-07-24T11:59:59.999Z');
const WITHIN_WINDOW = new Date('2026-07-25T13:00:00.000Z');
const DUE_SOON = new Date('2026-07-30T12:00:00.000Z');

function createDailyBriefingUseCase(input: {
  readonly programs?: ReturnType<typeof programFixture>[];
  readonly projects?: ReturnType<typeof projectFixture>[];
  readonly milestones?: ReturnType<typeof milestoneFixture>[];
  readonly tasks?: ReturnType<typeof taskFixture>[];
  readonly events?: ReturnType<typeof domainEventFixture>[];
  readonly missionControlAccessPolicy?: MissionControlAccessPolicy;
  readonly dailyBriefingAccessPolicy?: DailyBriefingAccessPolicy;
}) {
  const events = new InMemoryEventRepository(input.events ?? []);
  const listRecentOrganizationEvents = new ListRecentOrganizationEventsUseCase(events);
  const missionControlService = new MissionControlService(
    new GetMissionControlSnapshotUseCase({
      programs: new InMemoryProgramRepository(input.programs ?? []),
      projects: new InMemoryProjectRepository(input.projects ?? []),
      milestones: new InMemoryMilestoneRepository(input.milestones ?? []),
      tasks: new InMemoryTaskRepository(input.tasks ?? []),
      listRecentOrganizationEvents,
      clock: CLOCK,
      ...(input.missionControlAccessPolicy === undefined
        ? {}
        : { accessPolicy: input.missionControlAccessPolicy }),
    }),
  );

  const useCase = new GetDailyBriefingSnapshotUseCase({
    missionControl: missionControlService,
    listRecentOrganizationEvents,
    clock: CLOCK,
    ...(input.dailyBriefingAccessPolicy === undefined
      ? {}
      : { accessPolicy: input.dailyBriefingAccessPolicy }),
  });

  return { useCase, events };
}

test('empty organization returns an empty briefing snapshot', async () => {
  const { useCase } = createDailyBriefingUseCase({});
  const snapshot = await useCase.execute(MISSION_CONTROL_CONTEXT);

  assert.equal(snapshot.organization.organizationId, ORGANIZATION_ID);
  assert.equal(snapshot.attentionItems.length, 0);
  assert.equal(snapshot.projectHighlights.length, 0);
  assert.equal(snapshot.upcomingWork.length, 0);
  assert.equal(snapshot.recentChanges.length, 0);
  assert.equal(snapshot.executiveSignals.activeProjects, 0);
  assert.equal(snapshot.completeness.status, 'complete');
});

test('populated organization assembles executive signals and briefing sections', async () => {
  const { useCase } = createDailyBriefingUseCase({
    programs: [programFixture()],
    projects: [projectFixture(), projectFixture({ id: PROJECT_B_ID, name: 'Beta Study' })],
    milestones: [
      milestoneFixture({ plannedEndDate: YESTERDAY }),
      milestoneFixture({ id: MILESTONE_B_ID, plannedEndDate: DUE_SOON }),
    ],
    tasks: [
      taskFixture({ status: 'BLOCKED' }),
      taskFixture({ id: TASK_B_ID, plannedEndDate: DUE_SOON }),
    ],
    events: [
      domainEventFixture({ occurredAt: WITHIN_WINDOW }),
      domainEventFixture({
        id: identifier('event-2', 'DomainEventId') as DomainEventId,
        eventType: 'project.updated',
        occurredAt: WITHIN_WINDOW,
      }),
    ],
  });

  const snapshot = await useCase.execute(MISSION_CONTROL_CONTEXT);

  assert.equal(snapshot.executiveSignals.activeProjects, 2);
  assert.ok(snapshot.attentionItems.length > 0);
  assert.ok(snapshot.projectHighlights.length > 0);
  assert.ok(snapshot.upcomingWork.length > 0);
  assert.equal(snapshot.recentChanges.length, 2);
  assert.ok(snapshot.evidence.length > 0);
});

test('briefing window defaults to a 24-hour lookback from the fixed clock', async () => {
  const { useCase } = createDailyBriefingUseCase({});
  const snapshot = await useCase.execute(MISSION_CONTROL_CONTEXT);

  assert.equal(snapshot.briefingWindow.lookbackHours, DAILY_BRIEFING_DEFAULT_LOOKBACK_HOURS);
  assert.equal(snapshot.briefingWindow.endsAt.toISOString(), NOW.toISOString());
  assert.equal(
    snapshot.briefingWindow.startsAt.toISOString(),
    new Date(NOW.getTime() - 24 * 60 * 60 * 1000).toISOString(),
  );
});

test('fixed-clock repeatability returns equivalent briefing snapshots', async () => {
  const { useCase } = createDailyBriefingUseCase({
    projects: [projectFixture()],
    milestones: [milestoneFixture({ plannedEndDate: YESTERDAY })],
    tasks: [taskFixture({ status: 'BLOCKED' })],
    events: [domainEventFixture({ occurredAt: WITHIN_WINDOW })],
  });

  const first = await useCase.execute(MISSION_CONTROL_CONTEXT);
  const second = await useCase.execute(MISSION_CONTROL_CONTEXT);

  assert.deepEqual(
    {
      briefingWindow: first.briefingWindow,
      executiveSignals: first.executiveSignals,
      attentionItems: first.attentionItems,
      projectHighlights: first.projectHighlights,
      upcomingWork: first.upcomingWork,
      recentChanges: first.recentChanges,
      evidence: first.evidence,
      completeness: first.completeness,
      metadata: first.metadata,
    },
    {
      briefingWindow: second.briefingWindow,
      executiveSignals: second.executiveSignals,
      attentionItems: second.attentionItems,
      projectHighlights: second.projectHighlights,
      upcomingWork: second.upcomingWork,
      recentChanges: second.recentChanges,
      evidence: second.evidence,
      completeness: second.completeness,
      metadata: second.metadata,
    },
  );
});

test('attention items are bounded while preserving mission control ordering', async () => {
  const milestones = Array.from({ length: DAILY_BRIEFING_ATTENTION_LIMIT + 3 }, (_, index) =>
    milestoneFixture({
      id: identifier(`milestone-${index}`, 'MilestoneId'),
      name: `Milestone ${String(index).padStart(2, '0')}`,
      plannedEndDate: YESTERDAY,
    }),
  );

  const { useCase } = createDailyBriefingUseCase({
    projects: [projectFixture()],
    milestones,
  });

  const missionControl = await new MissionControlService(
    new GetMissionControlSnapshotUseCase({
      programs: new InMemoryProgramRepository([]),
      projects: new InMemoryProjectRepository([projectFixture()]),
      milestones: new InMemoryMilestoneRepository(milestones),
      tasks: new InMemoryTaskRepository([]),
      listRecentOrganizationEvents: new ListRecentOrganizationEventsUseCase(
        new InMemoryEventRepository([]),
      ),
      clock: CLOCK,
    }),
  ).getSnapshot(MISSION_CONTROL_CONTEXT);

  const snapshot = await useCase.execute(MISSION_CONTROL_CONTEXT);

  assert.equal(snapshot.attentionItems.length, DAILY_BRIEFING_ATTENTION_LIMIT);
  assert.deepEqual(
    snapshot.attentionItems.map((item) => item.title),
    missionControl.attentionItems
      .slice(0, DAILY_BRIEFING_ATTENTION_LIMIT)
      .map((item) => item.title),
  );
});

test('project highlights follow mission control project health ordering', async () => {
  const projects = Array.from({ length: DAILY_BRIEFING_PROJECT_HIGHLIGHT_LIMIT + 2 }, (_, index) =>
    projectFixture({
      id: identifier(`project-${index}`, 'ProjectId'),
      name: `Project ${String.fromCharCode(90 - index)}`,
      status: 'ACTIVE',
    }),
  );

  const { useCase } = createDailyBriefingUseCase({
    projects,
    milestones: projects.map((project) =>
      milestoneFixture({
        id: identifier(`milestone-${project.id}`, 'MilestoneId'),
        projectId: project.id,
        plannedEndDate: YESTERDAY,
      }),
    ),
  });

  const missionControl = await new MissionControlService(
    new GetMissionControlSnapshotUseCase({
      programs: new InMemoryProgramRepository([]),
      projects: new InMemoryProjectRepository(projects),
      milestones: new InMemoryMilestoneRepository(
        projects.map((project) =>
          milestoneFixture({
            id: identifier(`milestone-${project.id}`, 'MilestoneId'),
            projectId: project.id,
            plannedEndDate: YESTERDAY,
          }),
        ),
      ),
      tasks: new InMemoryTaskRepository([]),
      listRecentOrganizationEvents: new ListRecentOrganizationEventsUseCase(
        new InMemoryEventRepository([]),
      ),
      clock: CLOCK,
    }),
  ).getSnapshot(MISSION_CONTROL_CONTEXT);

  const snapshot = await useCase.execute(MISSION_CONTROL_CONTEXT);

  assert.equal(snapshot.projectHighlights.length, DAILY_BRIEFING_PROJECT_HIGHLIGHT_LIMIT);
  assert.deepEqual(
    snapshot.projectHighlights.map((project) => project.projectId),
    missionControl.projectHealth
      .slice(0, DAILY_BRIEFING_PROJECT_HIGHLIGHT_LIMIT)
      .map((project) => project.projectId),
  );
});

test('upcoming work includes due-soon milestones and tasks that are not overdue', async () => {
  const { useCase } = createDailyBriefingUseCase({
    projects: [projectFixture()],
    milestones: [
      milestoneFixture({ plannedEndDate: DUE_SOON }),
      milestoneFixture({
        id: MILESTONE_B_ID,
        plannedEndDate: YESTERDAY,
      }),
    ],
    tasks: [
      taskFixture({ id: TASK_B_ID, plannedEndDate: DUE_SOON }),
      taskFixture({ plannedEndDate: YESTERDAY }),
    ],
  });

  const snapshot = await useCase.execute(MISSION_CONTROL_CONTEXT);

  assert.ok(snapshot.upcomingWork.some((item) => item.kind === 'milestone'));
  assert.ok(snapshot.upcomingWork.some((item) => item.kind === 'task'));
  assert.ok(snapshot.upcomingWork.every((item) => item.plannedEndDate !== YESTERDAY.toISOString()));
});

test('recent changes include organization events within the briefing window', async () => {
  const { useCase } = createDailyBriefingUseCase({
    projects: [projectFixture()],
    events: [
      domainEventFixture({
        id: identifier('event-in-window', 'DomainEventId') as DomainEventId,
        occurredAt: WITHIN_WINDOW,
      }),
      domainEventFixture({
        id: identifier('event-out-window', 'DomainEventId') as DomainEventId,
        occurredAt: BEFORE_WINDOW,
      }),
    ],
  });

  const snapshot = await useCase.execute(MISSION_CONTROL_CONTEXT);

  assert.equal(snapshot.recentChanges.length, 1);
  assert.equal(snapshot.recentChanges[0]?.eventId, 'event-in-window');
});

test('briefing-window event reads pass occurredAtOnOrAfter to the event repository', async () => {
  const { useCase, events } = createDailyBriefingUseCase({
    projects: [projectFixture()],
    events: [domainEventFixture({ occurredAt: WITHIN_WINDOW })],
  });

  await useCase.execute(MISSION_CONTROL_CONTEXT);

  const briefingQuery = events.listRecentQueries.find(
    (query) => query.occurredAtOnOrAfter !== undefined,
  );

  assert.ok(briefingQuery);
  assert.equal(briefingQuery.limit, DAILY_BRIEFING_RECENT_CHANGES_LIMIT);
  assert.equal(
    briefingQuery.occurredAtOnOrAfter?.toISOString(),
    new Date(NOW.getTime() - 24 * 60 * 60 * 1000).toISOString(),
  );
});

test('permission restrictions propagate null executive metrics and empty restricted slices', async () => {
  const missionControlAccessPolicy: MissionControlAccessPolicy = {
    canAccessDashboard: () => true,
    canReadPrograms: () => true,
    canReadProjects: () => true,
    canReadMilestones: () => true,
    canReadTasks: () => false,
    canReadRecentActivity: () => true,
  };

  const { useCase } = createDailyBriefingUseCase({
    projects: [projectFixture()],
    milestones: [milestoneFixture()],
    tasks: [taskFixture({ status: 'BLOCKED', plannedEndDate: YESTERDAY })],
    events: [domainEventFixture({ occurredAt: WITHIN_WINDOW })],
    missionControlAccessPolicy,
  });

  const snapshot = await useCase.execute(MISSION_CONTROL_CONTEXT);

  assert.deepEqual(snapshot.metadata.restrictedSlices, ['tasks']);
  assert.equal(snapshot.executiveSignals.overdueTasks, null);
  assert.equal(snapshot.executiveSignals.blockedTasks, null);
  assert.equal(snapshot.executiveSignals.dueSoonTasks, null);
  assert.equal(snapshot.upcomingWork.length, 0);
  assert.ok(!snapshot.attentionItems.some((item) => item.entity.entityType === 'Task'));
  assert.equal(snapshot.completeness.status, 'degraded');
});

test('restricted recent activity is not reconstructed through a separate event read', async () => {
  const missionControlAccessPolicy: MissionControlAccessPolicy = {
    canAccessDashboard: () => true,
    canReadPrograms: () => true,
    canReadProjects: () => true,
    canReadMilestones: () => true,
    canReadTasks: () => true,
    canReadRecentActivity: () => false,
  };

  const { useCase, events } = createDailyBriefingUseCase({
    projects: [projectFixture()],
    events: [domainEventFixture({ occurredAt: WITHIN_WINDOW })],
    missionControlAccessPolicy,
  });

  const snapshot = await useCase.execute(MISSION_CONTROL_CONTEXT);

  assert.equal(snapshot.recentChanges.length, 0);
  assert.equal(snapshot.executiveSignals.recentOrganizationEvents, null);
  assert.equal(snapshot.executiveSignals.changedProjectCount, null);
  assert.equal(events.listRecentQueries.length, 0);
});

test('evidence references trace attention entities and recent domain events', async () => {
  const { useCase } = createDailyBriefingUseCase({
    projects: [projectFixture()],
    milestones: [milestoneFixture({ plannedEndDate: YESTERDAY })],
    events: [
      domainEventFixture({
        id: identifier('event-evidence', 'DomainEventId') as DomainEventId,
        occurredAt: WITHIN_WINDOW,
      }),
    ],
  });

  const snapshot = await useCase.execute(MISSION_CONTROL_CONTEXT);

  assert.ok(
    snapshot.evidence.some(
      (item) =>
        item.evidenceType === 'operationalEntity' &&
        item.reference.entityType === 'Milestone',
    ),
  );
  assert.ok(
    snapshot.evidence.some(
      (item) =>
        item.evidenceType === 'domainEvent' && item.reference.eventId === 'event-evidence',
    ),
  );
});

test('briefing evidence and upcoming work remain deterministically ordered', async () => {
  const { useCase } = createDailyBriefingUseCase({
    projects: [projectFixture()],
    milestones: [
      milestoneFixture({ plannedEndDate: DUE_SOON, name: 'Later Milestone' }),
      milestoneFixture({
        id: MILESTONE_B_ID,
        plannedEndDate: new Date('2026-07-28T12:00:00.000Z'),
        name: 'Earlier Milestone',
      }),
    ],
    tasks: [
      taskFixture({ id: TASK_B_ID, plannedEndDate: DUE_SOON, name: 'Later Task' }),
      taskFixture({
        id: identifier('task-3', 'TaskId'),
        plannedEndDate: new Date('2026-07-28T12:00:00.000Z'),
        name: 'Earlier Task',
      }),
    ],
    events: [
      domainEventFixture({
        id: identifier('event-z', 'DomainEventId') as DomainEventId,
        occurredAt: WITHIN_WINDOW,
      }),
      domainEventFixture({
        id: identifier('event-a', 'DomainEventId') as DomainEventId,
        occurredAt: WITHIN_WINDOW,
      }),
    ],
  });

  const snapshot = await useCase.execute(MISSION_CONTROL_CONTEXT);

  assert.deepEqual(
    snapshot.upcomingWork.map((item) => item.title),
    [...snapshot.upcomingWork]
      .slice()
      .sort((left, right) => {
        const byDate = (left.plannedEndDate ?? '').localeCompare(right.plannedEndDate ?? '');
        return byDate !== 0 ? byDate : left.title.localeCompare(right.title);
      })
      .map((item) => item.title),
  );
  assert.deepEqual(
    snapshot.evidence.map((item) =>
      item.evidenceType === 'operationalEntity'
        ? `entity:${item.reference.entityType}:${item.reference.entityId}`
        : `event:${item.reference.eventId}`,
    ),
    [...snapshot.evidence]
      .slice()
      .sort((left, right) => {
        const leftKey =
          left.evidenceType === 'operationalEntity'
            ? `entity:${left.reference.entityType}:${left.reference.entityId}`
            : `event:${left.reference.eventId}`;
        const rightKey =
          right.evidenceType === 'operationalEntity'
            ? `entity:${right.reference.entityType}:${right.reference.entityId}`
            : `event:${right.reference.eventId}`;
        return leftKey.localeCompare(rightKey);
      })
      .map((item) =>
        item.evidenceType === 'operationalEntity'
          ? `entity:${item.reference.entityType}:${item.reference.entityId}`
          : `event:${item.reference.eventId}`,
      ),
  );
});

test('completeness is complete when all mission control slices are available', async () => {
  const { useCase } = createDailyBriefingUseCase({
    projects: [projectFixture()],
  });

  const snapshot = await useCase.execute(MISSION_CONTROL_CONTEXT);

  assert.equal(snapshot.completeness.status, 'complete');
  assert.equal(snapshot.completeness.degradationNotes.length, 0);
});

test('completeness is insufficient when all operational slices are restricted', async () => {
  const missionControlAccessPolicy: MissionControlAccessPolicy = {
    canAccessDashboard: () => true,
    canReadPrograms: () => true,
    canReadProjects: () => false,
    canReadMilestones: () => false,
    canReadTasks: () => false,
    canReadRecentActivity: () => false,
  };

  const { useCase } = createDailyBriefingUseCase({
    projects: [projectFixture()],
    milestones: [milestoneFixture()],
    tasks: [taskFixture()],
    events: [domainEventFixture()],
    missionControlAccessPolicy,
  });

  const snapshot = await useCase.execute(MISSION_CONTROL_CONTEXT);

  assert.equal(snapshot.completeness.status, 'insufficient');
  assert.equal(snapshot.projectHighlights.length, 0);
  assert.equal(snapshot.recentChanges.length, 0);
});

test('unauthorized daily briefing access is rejected before assembly', async () => {
  const { useCase } = createDailyBriefingUseCase({
    dailyBriefingAccessPolicy: {
      canAccessDailyBriefing: () => false,
    },
  });

  await assert.rejects(
    () => useCase.execute(MISSION_CONTROL_CONTEXT),
    AuthorizationDeniedError,
  );
});

test('DailyBriefingService delegates to the snapshot use case', async () => {
  const expected = { organization: { organizationId: ORGANIZATION_ID } };
  const service = new DailyBriefingService({
    async execute() {
      return expected as never;
    },
  } as never);

  const result = await service.getSnapshot(MISSION_CONTROL_CONTEXT);
  assert.equal(result, expected);
});
