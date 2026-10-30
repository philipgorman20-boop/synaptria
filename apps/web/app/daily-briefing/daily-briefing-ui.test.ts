import assert from 'node:assert/strict';
import test from 'node:test';

import {
  DailyBriefingNarrativeService,
  DailyBriefingService,
  type DailyBriefingSnapshot,
} from '@synaptria/application';
import { organizationId, projectId } from '@synaptria/core';
import { routes } from '@synaptria/config';

import { toDailyBriefingContext } from '../../lib/daily-briefing-context';
import { getDailyBriefingService } from '../../lib/daily-briefing-service';
import { getDailyBriefingNarrativeService } from '../../lib/daily-briefing-narrative-service';
import {
  DAILY_BRIEFING_ROUTE,
  attentionEvidenceKey,
  findNarrativeForEvidenceKey,
  formatCompletenessStatus,
  formatDailyBriefingWindow,
  formatEvidenceSourceCount,
  formatExecutiveSignalValue,
  getDailyBriefingRecentChangeHref,
  getDailyBriefingUpcomingHref,
  isExecutiveSignalUnavailable,
  projectHighlightEvidenceKey,
  recentChangeEvidenceKey,
  resolveBriefingHeadline,
  resolveExecutiveSummary,
  shouldShowDailyBriefingEmptyState,
  upcomingWorkEvidenceKey,
} from './daily-briefing-format';
import { DAILY_BRIEFING_EYEBROW } from './components/daily-briefing-ui-constants';

const ORG_ID = organizationId('org-1');
const PROJECT_UUID = '550e8400-e29b-41d4-a716-446655440000';
const MILESTONE_UUID = '660e8400-e29b-41d4-a716-446655440001';
const TASK_UUID = '770e8400-e29b-41d4-a716-446655440002';

test('service wiring exposes Daily Briefing facades', () => {
  assert.ok(getDailyBriefingService() instanceof DailyBriefingService);
  assert.ok(getDailyBriefingNarrativeService() instanceof DailyBriefingNarrativeService);
});

test('toDailyBriefingContext maps trusted organization context fields', () => {
  assert.deepEqual(
    toDailyBriefingContext({
      organizationId: ORG_ID,
      organizationName: 'Acme',
      organizationSlug: 'acme',
      userId: 'user-1' as never,
      membershipId: 'membership-1' as never,
      role: 'MEMBER',
      requestId: 'req-1' as never,
      correlationId: 'corr-1' as never,
    }),
    { organizationId: ORG_ID, role: 'MEMBER' },
  );
});

test('formatDailyBriefingWindow renders deterministic lookback text', () => {
  const text = formatDailyBriefingWindow({
    generatedAt: new Date('2026-07-26T12:00:00.000Z'),
    organization: { organizationId: ORG_ID },
    briefingWindow: {
      lookbackHours: 24,
      startsAt: new Date('2026-07-25T12:00:00.000Z'),
      endsAt: new Date('2026-07-26T12:00:00.000Z'),
    },
    executiveSignals: {
      activeProjects: 0,
      projectsAtRisk: 0,
      overdueTasks: 0,
      blockedTasks: 0,
      overdueMilestones: 0,
      dueSoonMilestones: 0,
      dueSoonTasks: 0,
      recentOrganizationEvents: 0,
      changedProjectCount: 0,
    },
    attentionItems: [],
    taskSignals: [],
    projectHighlights: [],
    upcomingWork: [],
    recentChanges: [],
    evidence: [],
    completeness: { status: 'complete', degradationNotes: [] },
    metadata: {
      deterministic: true,
      restrictedSlices: [],
      missionControlGeneratedAt: new Date('2026-07-26T12:00:00.000Z'),
    },
  });

  assert.match(text, /24h lookback/);
});

test('executive signal formatting preserves null restricted values', () => {
  assert.equal(formatExecutiveSignalValue(null), '—');
  assert.equal(isExecutiveSignalUnavailable(null), true);
  assert.equal(formatExecutiveSignalValue(3), '3');
});

test('grounded narrative association resolves by evidence key without exposing keys in labels', () => {
  const narrativeItem = {
    text: 'Alpha Study needs attention.',
    evidenceKeys: ['entity:Project:project-1'],
  };

  assert.deepEqual(
    findNarrativeForEvidenceKey([narrativeItem], projectHighlightEvidenceKey({
      projectId: 'project-1',
      projectName: 'Alpha Study',
      healthState: 'at_risk',
      attentionSeverity: 'high',
      overdueTasks: 1,
      blockedTasks: 0,
      overdueMilestones: 0,
      dueSoonMilestones: 0,
      dueSoonTasks: 0,
      recentEventCount: 1,
    })),
    narrativeItem,
  );
  assert.equal(formatEvidenceSourceCount(narrativeItem.evidenceKeys), '1 source');
});

test('attention and recent-change evidence keys align with snapshot entities', () => {
  assert.equal(
    attentionEvidenceKey({
      type: 'overdue_task',
      severity: 'high',
      entity: { entityType: 'Task', entityId: TASK_UUID },
      title: 'Task',
      reason: 'Overdue',
    }),
    `entity:Task:${TASK_UUID}`,
  );
  assert.equal(recentChangeEvidenceKey({
    eventId: 'event-1',
    eventType: 'project.updated',
    aggregateType: 'Project',
    aggregateId: PROJECT_UUID,
    occurredAt: '2026-07-26T12:00:00.000Z',
  }), 'event:event-1');
});

test('upcoming work routes are built only when snapshot contains required identifiers', () => {
  assert.equal(
    getDailyBriefingUpcomingHref({
      kind: 'milestone',
      entityId: MILESTONE_UUID,
      title: 'Draft',
      projectId: PROJECT_UUID,
      projectName: 'Alpha Study',
      status: 'IN_PROGRESS',
    }),
    `/projects/${PROJECT_UUID}/milestones/${MILESTONE_UUID}`,
  );

  assert.equal(
    getDailyBriefingUpcomingHref({
      kind: 'task',
      entityId: TASK_UUID,
      title: 'Prepare',
      projectId: PROJECT_UUID,
      projectName: 'Alpha Study',
      status: 'TODO',
    }),
    null,
  );

  assert.equal(
    upcomingWorkEvidenceKey({
      kind: 'task',
      entityId: TASK_UUID,
      title: 'Prepare',
      projectId: PROJECT_UUID,
      projectName: 'Alpha Study',
      status: 'TODO',
      milestoneId: MILESTONE_UUID,
    }),
    `entity:Task:${TASK_UUID}`,
  );
});

test('recent change routes use only supported aggregate types', () => {
  assert.equal(
    getDailyBriefingRecentChangeHref({
      eventId: 'event-1',
      eventType: 'project.updated',
      aggregateType: 'Project',
      aggregateId: PROJECT_UUID,
      occurredAt: '2026-07-26T12:00:00.000Z',
    }),
    `/projects/${PROJECT_UUID}`,
  );
  assert.equal(
    getDailyBriefingRecentChangeHref({
      eventId: 'event-2',
      eventType: 'task.updated',
      aggregateType: 'Task',
      aggregateId: TASK_UUID,
      occurredAt: '2026-07-26T12:00:00.000Z',
    }),
    null,
  );
});

test('resolveBriefingHeadline prefers grounded narrative text when available', () => {
  const snapshot = {
    completeness: { status: 'complete' as const, degradationNotes: [] },
  } as never;

  assert.equal(
    resolveBriefingHeadline(
      {
        headline: { text: 'Grounded headline', evidenceKeys: ['entity:Project:p1'] },
      } as never,
      snapshot,
    ),
    'Grounded headline',
  );
  assert.equal(resolveBriefingHeadline(null, snapshot), 'Operational briefing');
});

test('resolveExecutiveSummary returns grounded block only when narrative exists', () => {
  const summary = { text: 'Grounded summary', evidenceKeys: ['entity:Project:p1'] };
  assert.deepEqual(
    resolveExecutiveSummary({ executiveSummary: summary } as never),
    summary,
  );
  assert.equal(resolveExecutiveSummary(null), null);
});

test('empty briefing detection respects deterministic snapshot shape', () => {
  const emptySnapshot: DailyBriefingSnapshot = {
    generatedAt: new Date('2026-07-26T12:00:00.000Z'),
    organization: { organizationId: ORG_ID },
    briefingWindow: {
      lookbackHours: 24,
      startsAt: new Date('2026-07-25T12:00:00.000Z'),
      endsAt: new Date('2026-07-26T12:00:00.000Z'),
    },
    attentionItems: [],
    taskSignals: [],
    projectHighlights: [],
    upcomingWork: [],
    recentChanges: [],
    executiveSignals: {
      activeProjects: 0,
      projectsAtRisk: 0,
      overdueTasks: 0,
      blockedTasks: 0,
      overdueMilestones: 0,
      dueSoonMilestones: 0,
      dueSoonTasks: 0,
      recentOrganizationEvents: 0,
      changedProjectCount: 0,
    },
    evidence: [],
    completeness: { status: 'complete', degradationNotes: [] },
    metadata: {
      deterministic: true,
      restrictedSlices: [],
      missionControlGeneratedAt: new Date('2026-07-26T12:00:00.000Z'),
    },
  };

  assert.equal(shouldShowDailyBriefingEmptyState(emptySnapshot), true);
  assert.equal(
    shouldShowDailyBriefingEmptyState({
      ...emptySnapshot,
      executiveSignals: {
        ...emptySnapshot.executiveSignals,
        activeProjects: 1,
      },
    }),
    false,
  );
});

test('degraded and insufficient completeness labels are deterministic', () => {
  assert.equal(formatCompletenessStatus('degraded'), 'Degraded');
  assert.equal(formatCompletenessStatus('insufficient'), 'Insufficient');
});

test('navigation routes include daily briefing and mission control paths', () => {
  assert.equal(DAILY_BRIEFING_ROUTE, '/daily-briefing');
  assert.equal(routes.dashboard, '/dashboard');
});

test('page semantics constants expose accessible section labels', () => {
  assert.equal(DAILY_BRIEFING_EYEBROW, 'DAILY BRIEFING');
});

test('project highlight href uses canonical project route', () => {
  assert.equal(
    `/projects/${PROJECT_UUID}`,
    `/projects/${projectId(PROJECT_UUID)}`,
  );
});
