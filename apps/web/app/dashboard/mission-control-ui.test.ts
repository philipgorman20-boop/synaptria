import assert from 'node:assert/strict';
import test from 'node:test';

import { MissionControlService } from '@synaptria/application';
import { organizationId } from '@synaptria/core';
import type {
  MissionControlAttentionItem,
  MissionControlMilestoneSignal,
  MissionControlProjectHealth,
  MissionControlRecentActivityItem,
  MissionControlSnapshot,
  MissionControlTaskSignal,
} from '@synaptria/application/mission-control';
import { routes } from '@synaptria/config';

import { getMissionControlService } from '../../lib/mission-control-service';
import { toMissionControlContext } from '../../lib/mission-control-context';
import {
  ATTENTION_LIST_HEADING,
  MISSION_CONTROL_PAGE_TITLE,
  MISSION_CONTROL_SUBTITLE,
} from './components/mission-control-ui-constants';
import {
  buildUpcomingWorkItems,
  formatAttentionType,
  formatEventTypeLabel,
  formatMissionControlSeverity,
  formatProjectHealthRiskSummary,
  formatProjectHealthState,
  formatRestrictedSliceLabels,
  getAttentionItemHref,
  getKpiValue,
  getProjectHealthHref,
  getRecentActivityHref,
  getUpcomingItemHref,
  isSliceRestricted,
  MISSION_CONTROL_EMPTY_ATTENTION_MESSAGE,
  MISSION_CONTROL_EMPTY_UPCOMING_MESSAGE,
  MISSION_CONTROL_KPI_DEFINITIONS,
  MISSION_CONTROL_RESTRICTED_NOTICE,
  shouldShowEmptyOrganizationState,
  shouldShowProjectHealthSeverity,
} from './mission-control-format';

const PROJECT_UUID = '550e8400-e29b-41d4-a716-446655440000';
const MILESTONE_UUID = '660e8400-e29b-41d4-a716-446655440001';
const TASK_UUID = '770e8400-e29b-41d4-a716-446655440002';
const PROGRAM_UUID = '880e8400-e29b-41d4-a716-446655440003';

test('getMissionControlService returns a wired MissionControlService facade', () => {
  const service = getMissionControlService();

  assert.ok(service instanceof MissionControlService);
  assert.equal(typeof service.getSnapshot, 'function');
});

test('toMissionControlContext maps trusted organization context fields', () => {
  const context = toMissionControlContext({
    organizationId: organizationId('org-1'),
    organizationName: 'Acme Biotech',
    organizationSlug: 'acme',
    userId: 'user-1' as never,
    membershipId: 'membership-1' as never,
    role: 'MEMBER',
    requestId: 'req-1' as never,
    correlationId: 'corr-1' as never,
  });

  assert.deepEqual(context, {
    organizationId: organizationId('org-1'),
    role: 'MEMBER',
  });
});

test('KPI definitions expose expected primary metrics and routes', () => {
  const labels = MISSION_CONTROL_KPI_DEFINITIONS.map((definition) => definition.label);

  assert.deepEqual(labels, [
    'Active Projects',
    'Open Milestones',
    'Overdue Tasks',
    'Blocked Tasks',
    'Recent Activity',
    'Open Tasks',
  ]);
  assert.equal(
    MISSION_CONTROL_KPI_DEFINITIONS.find((definition) => definition.key === 'activeProjects')
      ?.href,
    routes.projects,
  );
});

test('getKpiValue reads snapshot summary values without recalculation', () => {
  const summary = {
    activePrograms: 1,
    activeProjects: 4,
    openMilestones: 9,
    openTasks: 12,
    overdueMilestones: 2,
    overdueTasks: 3,
    blockedTasks: 1,
    completedTasks: 5,
    recentActivityCount: 7,
  };

  assert.equal(getKpiValue(summary, 'activeProjects'), 4);
  assert.equal(getKpiValue(summary, 'blockedTasks'), 1);
  assert.equal(getKpiValue(summary, 'recentActivityCount'), 7);
});

test('attention helpers expose readable severity and type labels', () => {
  assert.equal(formatMissionControlSeverity('critical'), 'Critical');
  assert.equal(formatAttentionType('blocked_task'), 'Blocked task');
});

test('attention item hrefs use existing module routes', () => {
  const milestoneItem: MissionControlAttentionItem = {
    type: 'overdue_milestone',
    severity: 'high',
    entity: { entityType: 'Milestone', entityId: MILESTONE_UUID },
    title: 'Protocol Draft',
    reason: 'Milestone is overdue.',
    projectId: PROJECT_UUID,
    dueDate: '2026-07-20',
  };

  const taskItem: MissionControlAttentionItem = {
    type: 'blocked_task',
    severity: 'medium',
    entity: { entityType: 'Task', entityId: TASK_UUID },
    title: 'Prepare reagents',
    reason: 'Task is blocked.',
    projectId: PROJECT_UUID,
    milestoneId: MILESTONE_UUID,
  };

  assert.equal(
    getAttentionItemHref(milestoneItem),
    `/projects/${PROJECT_UUID}/milestones/${MILESTONE_UUID}`,
  );
  assert.equal(
    getAttentionItemHref(taskItem),
    `/projects/${PROJECT_UUID}/milestones/${MILESTONE_UUID}/tasks/${TASK_UUID}`,
  );
});

test('empty attention state message is deterministic', () => {
  assert.equal(
    MISSION_CONTROL_EMPTY_ATTENTION_MESSAGE,
    'No overdue, blocked, or due-soon work needs attention.',
  );
});

test('upcoming work uses dueSoon signals without recomputing due dates', () => {
  const milestoneSignals: MissionControlMilestoneSignal[] = [
    {
      milestoneId: MILESTONE_UUID,
      milestoneName: 'Protocol Draft',
      projectId: PROJECT_UUID,
      projectName: 'Alpha Study',
      status: 'IN_PROGRESS',
      plannedEndDate: '2026-07-30',
      overdue: false,
      dueSoon: true,
      openTaskCount: 2,
      blockedTaskCount: 0,
      overdueTaskCount: 0,
    },
    {
      milestoneId: 'milestone-later',
      milestoneName: 'Later Milestone',
      projectId: PROJECT_UUID,
      projectName: 'Alpha Study',
      status: 'IN_PROGRESS',
      plannedEndDate: '2026-08-20',
      overdue: false,
      dueSoon: false,
      openTaskCount: 1,
      blockedTaskCount: 0,
      overdueTaskCount: 0,
    },
  ];

  const taskSignals: MissionControlTaskSignal[] = [
    {
      taskId: TASK_UUID,
      taskName: 'Prepare reagents',
      milestoneId: MILESTONE_UUID,
      milestoneName: 'Protocol Draft',
      projectId: PROJECT_UUID,
      projectName: 'Alpha Study',
      status: 'TODO',
      priority: 'MEDIUM',
      plannedEndDate: '2026-07-28',
      overdue: false,
      dueSoon: true,
      blocked: false,
    },
  ];

  const items = buildUpcomingWorkItems(milestoneSignals, taskSignals);

  assert.equal(items.length, 2);
  const hrefs = items.map((item) => getUpcomingItemHref(item)).sort();
  assert.deepEqual(hrefs, [
    `/projects/${PROJECT_UUID}/milestones/${MILESTONE_UUID}`,
    `/projects/${PROJECT_UUID}/milestones/${MILESTONE_UUID}/tasks/${TASK_UUID}`,
  ].sort());
});

test('upcoming empty state message is deterministic', () => {
  assert.equal(
    MISSION_CONTROL_EMPTY_UPCOMING_MESSAGE,
    'No milestones or tasks are due within the next week.',
  );
});

test('project health labels expose categorical health states', () => {
  assert.equal(formatProjectHealthState('at_risk'), 'At risk');
  assert.equal(formatProjectHealthState('watch'), 'Watch');
  assert.equal(formatProjectHealthState('on_track'), 'On track');
});

test('project health links use the existing project detail route', () => {
  const projectHealth: MissionControlProjectHealth = {
    projectId: PROJECT_UUID,
    projectName: 'Alpha Study',
    status: 'ACTIVE',
    priority: 'MEDIUM',
    openMilestones: 2,
    overdueMilestones: 0,
    openTasks: 3,
    overdueTasks: 0,
    blockedTasks: 0,
    dueSoonMilestones: 1,
    dueSoonTasks: 1,
    recentEventCount: 2,
    attentionSeverity: 'low',
    healthState: 'on_track',
  };

  assert.equal(getProjectHealthHref(projectHealth), `/projects/${PROJECT_UUID}`);
});

test('project health risk summary uses concise healthy presentation text', () => {
  assert.equal(
    formatProjectHealthRiskSummary({
      projectId: PROJECT_UUID,
      projectName: 'Alpha Study',
      status: 'ACTIVE',
      priority: 'MEDIUM',
      openMilestones: 1,
      overdueMilestones: 0,
      openTasks: 2,
      overdueTasks: 0,
      blockedTasks: 0,
      dueSoonMilestones: 0,
      dueSoonTasks: 0,
      recentEventCount: 0,
      attentionSeverity: 'low',
      healthState: 'on_track',
    }),
    'No execution risks',
  );
});

test('project health severity label is shown only when it adds context', () => {
  assert.equal(
    shouldShowProjectHealthSeverity({
      projectId: PROJECT_UUID,
      projectName: 'Alpha Study',
      status: 'ACTIVE',
      priority: 'MEDIUM',
      openMilestones: 1,
      overdueMilestones: 1,
      openTasks: 2,
      overdueTasks: 1,
      blockedTasks: 1,
      dueSoonMilestones: 0,
      dueSoonTasks: 0,
      recentEventCount: 1,
      attentionSeverity: 'critical',
      healthState: 'at_risk',
    }),
    true,
  );
  assert.equal(
    shouldShowProjectHealthSeverity({
      projectId: PROJECT_UUID,
      projectName: 'Alpha Study',
      status: 'ACTIVE',
      priority: 'MEDIUM',
      openMilestones: 1,
      overdueMilestones: 0,
      openTasks: 2,
      overdueTasks: 0,
      blockedTasks: 0,
      dueSoonMilestones: 0,
      dueSoonTasks: 0,
      recentEventCount: 0,
      attentionSeverity: 'low',
      healthState: 'on_track',
    }),
    false,
  );
});

test('recent activity labels avoid raw event JSON', () => {
  assert.equal(formatEventTypeLabel('project.created'), 'Project · Created');
});

test('recent activity hrefs only use safely derivable routes', () => {
  const projectEvent: MissionControlRecentActivityItem = {
    eventId: 'event-1',
    eventType: 'project.updated',
    aggregateType: 'Project',
    aggregateId: PROJECT_UUID,
    occurredAt: '2026-07-26T12:00:00.000Z',
  };

  const taskEvent: MissionControlRecentActivityItem = {
    eventId: 'event-2',
    eventType: 'task.created',
    aggregateType: 'Task',
    aggregateId: TASK_UUID,
    occurredAt: '2026-07-26T11:00:00.000Z',
  };

  assert.equal(getRecentActivityHref(projectEvent), `/projects/${PROJECT_UUID}`);
  assert.equal(getRecentActivityHref(taskEvent), null);
});

test('restricted slice notice copy is informational', () => {
  assert.match(MISSION_CONTROL_RESTRICTED_NOTICE, /access permissions/);
  assert.equal(
    formatRestrictedSliceLabels(['projects', 'tasks']),
    'projects, tasks',
  );
});

test('restricted slices hide KPI values instead of exposing misleading counts', () => {
  assert.equal(isSliceRestricted('projects', ['projects']), true);
  assert.equal(isSliceRestricted('milestones', ['projects']), false);
});

test('empty organization detection avoids misleading guidance when slices are restricted', () => {
  const restrictedSnapshot = snapshotFixture({
    summary: {
      activePrograms: 0,
      activeProjects: 0,
      openMilestones: 0,
      openTasks: 0,
      overdueMilestones: 0,
      overdueTasks: 0,
      blockedTasks: 0,
      completedTasks: 0,
      recentActivityCount: 0,
    },
    metadata: {
      deterministic: true,
      restrictedSlices: ['projects'],
    },
  });

  const emptySnapshot = snapshotFixture({
    summary: {
      activePrograms: 0,
      activeProjects: 0,
      openMilestones: 0,
      openTasks: 0,
      overdueMilestones: 0,
      overdueTasks: 0,
      blockedTasks: 0,
      completedTasks: 0,
      recentActivityCount: 0,
    },
  });

  assert.equal(shouldShowEmptyOrganizationState(restrictedSnapshot), false);
  assert.equal(shouldShowEmptyOrganizationState(emptySnapshot), true);
});

test('mission control UI constants expose page structure labels', () => {
  assert.equal(MISSION_CONTROL_PAGE_TITLE, 'Mission Control');
  assert.equal(
    MISSION_CONTROL_SUBTITLE,
    'What needs attention across your organization.',
  );
  assert.equal(ATTENTION_LIST_HEADING, 'Needs Attention');
});

test('attention navigation supports program entities when present', () => {
  const programItem: MissionControlAttentionItem = {
    type: 'recent_significant_activity',
    severity: 'low',
    entity: { entityType: 'Program', entityId: PROGRAM_UUID },
    title: 'program.created',
    reason: 'Recent program activity.',
  };

  assert.equal(getAttentionItemHref(programItem), `/programs/${PROGRAM_UUID}`);
});

function snapshotFixture(
  overrides: Partial<MissionControlSnapshot> = {},
): MissionControlSnapshot {
  return {
    generatedAt: new Date('2026-07-26T12:00:00.000Z'),
    organization: {
      organizationId: organizationId('org-1'),
    },
    summary: {
      activePrograms: 0,
      activeProjects: 0,
      openMilestones: 0,
      openTasks: 0,
      overdueMilestones: 0,
      overdueTasks: 0,
      blockedTasks: 0,
      completedTasks: 0,
      recentActivityCount: 0,
    },
    attentionItems: [],
    projectHealth: [],
    milestoneSignals: [],
    taskSignals: [],
    recentActivity: [],
    metadata: {
      deterministic: true,
      restrictedSlices: [],
    },
    ...overrides,
  };
}
