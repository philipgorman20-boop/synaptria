import assert from 'node:assert/strict';
import test from 'node:test';

import { organizationId } from '@synaptria/core';

import { buildDailyBriefingEvidence } from './evidence';
import { dailyBriefingSnapshotFixture } from './narrative/testing/fixtures';

test('buildDailyBriefingEvidence includes upcoming work milestone and task entities', () => {
  const snapshot = dailyBriefingSnapshotFixture();
  const evidence = buildDailyBriefingEvidence({
    organizationId: organizationId('org-1'),
    attentionItems: snapshot.attentionItems,
    projectHighlights: snapshot.projectHighlights,
    upcomingWork: snapshot.upcomingWork,
    recentChanges: snapshot.recentChanges,
  });

  const keys = evidence.map((item) =>
    item.evidenceType === 'operationalEntity'
      ? `entity:${item.reference.entityType}:${item.reference.entityId}`
      : `event:${item.reference.eventId}`,
  );

  assert.ok(keys.includes('entity:Milestone:milestone-1'));
  assert.ok(keys.includes('entity:Task:task-1'));
  assert.ok(keys.includes('entity:Project:project-1'));
  assert.ok(keys.includes('event:event-1'));
});
