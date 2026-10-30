import assert from 'node:assert/strict';
import test from 'node:test';

import {
  DAILY_BRIEFING_NARRATIVE_ATTENTION_LIMIT,
  DAILY_BRIEFING_NARRATIVE_PROJECT_HIGHLIGHT_LIMIT,
  DAILY_BRIEFING_NARRATIVE_RECENT_CHANGE_LIMIT,
  DAILY_BRIEFING_NARRATIVE_UPCOMING_LIMIT,
} from '../constants';
import { dailyBriefingSnapshotFixture } from './testing/fixtures';
import { selectDailyBriefingNarrativeTargets } from './select-narrative-targets';

test('selectDailyBriefingNarrativeTargets bounds each section deterministically', () => {
  const attentionItems = Array.from({ length: DAILY_BRIEFING_NARRATIVE_ATTENTION_LIMIT + 2 }, (_, index) => ({
    type: 'overdue_task' as const,
    severity: 'high' as const,
    entity: { entityType: 'Task' as const, entityId: `task-${index}` },
    title: `Task ${index}`,
    reason: 'Overdue.',
    projectId: 'project-1',
  }));
  const projectHighlights = Array.from(
    { length: DAILY_BRIEFING_NARRATIVE_PROJECT_HIGHLIGHT_LIMIT + 1 },
    (_, index) => ({
      projectId: `project-${index}`,
      projectName: `Project ${index}`,
      healthState: 'at_risk' as const,
      attentionSeverity: 'high' as const,
      overdueTasks: 1,
      blockedTasks: 0,
      overdueMilestones: 0,
      dueSoonMilestones: 0,
      dueSoonTasks: 0,
      recentEventCount: 0,
    }),
  );
  const upcomingWork = Array.from({ length: DAILY_BRIEFING_NARRATIVE_UPCOMING_LIMIT + 2 }, (_, index) => ({
    kind: 'task' as const,
    entityId: `upcoming-${index}`,
    title: `Upcoming ${index}`,
    projectId: 'project-1',
    projectName: 'Alpha Study',
    status: 'IN_PROGRESS',
  }));
  const recentChanges = Array.from(
    { length: DAILY_BRIEFING_NARRATIVE_RECENT_CHANGE_LIMIT + 2 },
    (_, index) => ({
      eventId: `event-${index}`,
      eventType: 'project.updated',
      aggregateType: 'Project',
      aggregateId: 'project-1',
      occurredAt: '2026-07-25T14:00:00.000Z',
    }),
  );

  const targets = selectDailyBriefingNarrativeTargets(
    dailyBriefingSnapshotFixture({
      attentionItems,
      projectHighlights,
      upcomingWork,
      recentChanges,
    }),
  );

  assert.equal(targets.attentionEvidenceKeys.length, DAILY_BRIEFING_NARRATIVE_ATTENTION_LIMIT);
  assert.equal(
    targets.projectHighlightEvidenceKeys.length,
    DAILY_BRIEFING_NARRATIVE_PROJECT_HIGHLIGHT_LIMIT,
  );
  assert.equal(targets.upcomingWorkEvidenceKeys.length, DAILY_BRIEFING_NARRATIVE_UPCOMING_LIMIT);
  assert.equal(
    targets.recentChangeEvidenceKeys.length,
    DAILY_BRIEFING_NARRATIVE_RECENT_CHANGE_LIMIT,
  );
  assert.equal(targets.attentionEvidenceKeys[0], 'entity:Task:task-0');
});
