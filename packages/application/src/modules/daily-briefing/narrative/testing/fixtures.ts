import { identifier, organizationId } from '@synaptria/core';

import type { DailyBriefingSnapshot } from '../../types';

const ORGANIZATION_ID = organizationId('org-1');
const GENERATED_AT = new Date('2026-07-26T12:00:00.000Z');
const WINDOW_START = new Date('2026-07-25T12:00:00.000Z');

export function dailyBriefingSnapshotFixture(
  overrides: Partial<DailyBriefingSnapshot> = {},
): DailyBriefingSnapshot {
  return {
    generatedAt: GENERATED_AT,
    organization: { organizationId: ORGANIZATION_ID },
    briefingWindow: {
      lookbackHours: 24,
      startsAt: WINDOW_START,
      endsAt: GENERATED_AT,
    },
    executiveSignals: {
      activeProjects: 1,
      projectsAtRisk: 0,
      overdueTasks: 1,
      blockedTasks: 0,
      overdueMilestones: 0,
      dueSoonMilestones: 1,
      dueSoonTasks: 0,
      recentOrganizationEvents: 1,
      changedProjectCount: 1,
    },
    attentionItems: [
      {
        type: 'overdue_task',
        severity: 'high',
        entity: { entityType: 'Task', entityId: 'task-1' },
        title: 'Prepare reagents',
        reason: 'Task is overdue.',
        dueDate: '2026-07-24T12:00:00.000Z',
        projectId: 'project-1',
        milestoneId: 'milestone-1',
      },
    ],
    taskSignals: [],
    projectHighlights: [
      {
        projectId: 'project-1',
        projectName: 'Alpha Study',
        healthState: 'at_risk',
        attentionSeverity: 'high',
        overdueTasks: 1,
        blockedTasks: 0,
        overdueMilestones: 0,
        dueSoonMilestones: 1,
        dueSoonTasks: 0,
        recentEventCount: 1,
        nextMilestoneDueDate: '2026-07-30T12:00:00.000Z',
      },
    ],
    upcomingWork: [
      {
        kind: 'milestone',
        entityId: 'milestone-1',
        title: 'Protocol Draft',
        projectId: 'project-1',
        projectName: 'Alpha Study',
        plannedEndDate: '2026-07-30T12:00:00.000Z',
        status: 'IN_PROGRESS',
      },
    ],
    recentChanges: [
      {
        eventId: 'event-1',
        eventType: 'project.updated',
        aggregateType: 'Project',
        aggregateId: 'project-1',
        occurredAt: '2026-07-25T14:00:00.000Z',
      },
    ],
    evidence: [
      {
        evidenceType: 'operationalEntity',
        reference: {
          organizationId: ORGANIZATION_ID,
          entityType: 'Task',
          entityId: 'task-1',
        },
        source: 'missionControl',
      },
      {
        evidenceType: 'operationalEntity',
        reference: {
          organizationId: ORGANIZATION_ID,
          entityType: 'Project',
          entityId: 'project-1',
        },
        source: 'missionControl',
      },
      {
        evidenceType: 'operationalEntity',
        reference: {
          organizationId: ORGANIZATION_ID,
          entityType: 'Milestone',
          entityId: 'milestone-1',
        },
        source: 'missionControl',
      },
      {
        evidenceType: 'domainEvent',
        reference: { eventId: identifier('event-1', 'DomainEventId') },
        source: 'recentEvents',
      },
    ],
    completeness: {
      status: 'complete',
      degradationNotes: [],
    },
    metadata: {
      deterministic: true,
      restrictedSlices: [],
      missionControlGeneratedAt: GENERATED_AT,
    },
    ...overrides,
  };
}

export function emptyDailyBriefingSnapshotFixture(): DailyBriefingSnapshot {
  return dailyBriefingSnapshotFixture({
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
  });
}

export function emptyGroundedNarrativePayload() {
  return {
    headline: {
      text: 'No material execution activity in the briefing window.',
      evidenceKeys: [],
    },
    executiveSummary: {
      text: 'The supplied snapshot contains no attention items, highlights, or recent changes.',
      evidenceKeys: [],
    },
    attentionItems: [],
    projectHighlightItems: [],
    upcomingWorkItems: [],
    recentChangeItems: [],
    completenessNote: null,
  };
}

export function groundedNarrativePayload() {
  return {
    headline: {
      text: 'Alpha Study needs attention',
      evidenceKeys: ['entity:Project:project-1'],
    },
    executiveSummary: {
      text: 'One overdue task and one due-soon milestone require follow-up.',
      evidenceKeys: ['entity:Task:task-1', 'entity:Project:project-1'],
    },
    attentionItems: [
      {
        text: 'Prepare reagents is overdue on Alpha Study.',
        evidenceKeys: ['entity:Task:task-1'],
      },
    ],
    projectHighlightItems: [
      {
        text: 'Alpha Study is at risk with one overdue task.',
        evidenceKeys: ['entity:Project:project-1'],
      },
    ],
    upcomingWorkItems: [
      {
        text: 'Protocol Draft is due soon on Alpha Study.',
        evidenceKeys: ['entity:Milestone:milestone-1'],
      },
    ],
    recentChangeItems: [
      {
        text: 'Alpha Study was updated during the briefing window.',
        evidenceKeys: ['event:event-1'],
      },
    ],
    completenessNote: null,
  };
}
