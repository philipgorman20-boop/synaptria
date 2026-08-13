import assert from 'node:assert/strict';
import test from 'node:test';

import type { DailyBriefingNarrative, DailyBriefingSnapshot } from '@synaptria/application';
import { ApplicationError } from '@synaptria/application';
import { ProviderError } from '@synaptria/ai';
import { organizationId } from '@synaptria/core';

import {
  DAILY_BRIEFING_AI_UNAVAILABLE_MESSAGE,
  isExpectedNarrativeGenerationFailure,
  loadDailyBriefingPageData,
} from './daily-briefing-loader';

const CONTEXT = {
  organizationId: organizationId('org-1'),
  role: 'MEMBER' as const,
};

function snapshotFixture(): DailyBriefingSnapshot {
  return {
    generatedAt: new Date('2026-07-26T12:00:00.000Z'),
    organization: { organizationId: CONTEXT.organizationId },
    briefingWindow: {
      lookbackHours: 24,
      startsAt: new Date('2026-07-25T12:00:00.000Z'),
      endsAt: new Date('2026-07-26T12:00:00.000Z'),
    },
    executiveSignals: {
      activeProjects: 1,
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
  };
}

function narrativeFixture(): DailyBriefingNarrative {
  const block = { text: 'Summary', evidenceKeys: [] as const };
  return {
    capabilityId: 'daily-briefing.narrative.v0',
    headline: block,
    executiveSummary: block,
    attentionItems: [],
    projectHighlightItems: [],
    upcomingWorkItems: [],
    recentChangeItems: [],
    sourceSnapshotGeneratedAt: new Date('2026-07-26T12:00:00.000Z'),
    generation: {
      provider: 'openai',
      model: 'gpt-4o-mini',
      usage: {},
      latencyMs: 10,
    },
  };
}

test('loadDailyBriefingPageData generates snapshot before narrative', async () => {
  const calls: string[] = [];
  const snapshot = snapshotFixture();

  const result = await loadDailyBriefingPageData(CONTEXT, {
    async getSnapshot() {
      calls.push('snapshot');
      return snapshot;
    },
    async generateNarrative(input) {
      calls.push('narrative');
      assert.equal(input.snapshot, snapshot);
      return narrativeFixture();
    },
  });

  assert.deepEqual(calls, ['snapshot', 'narrative']);
  assert.equal(result.snapshot, snapshot);
  assert.ok(result.narrative);
  assert.equal(result.aiSummaryUnavailable, false);
});

test('loadDailyBriefingPageData passes the exact authorized snapshot to narrative generation', async () => {
  const snapshot = snapshotFixture();

  await loadDailyBriefingPageData(CONTEXT, {
    async getSnapshot() {
      return snapshot;
    },
    async generateNarrative(input) {
      assert.equal(input.snapshot, snapshot);
      return narrativeFixture();
    },
  });
});

test('provider failures fall back to deterministic briefing data', async () => {
  const result = await loadDailyBriefingPageData(CONTEXT, {
    async getSnapshot() {
      return snapshotFixture();
    },
    async generateNarrative() {
      throw new ProviderError({
        code: 'PROVIDER_RATE_LIMIT_ERROR',
        message: 'Rate limit exceeded.',
        providerId: 'openai',
      });
    },
  });

  assert.equal(result.narrative, null);
  assert.equal(result.aiSummaryUnavailable, true);
});

test('application narrative validation failures fall back without exposing details', async () => {
  const result = await loadDailyBriefingPageData(CONTEXT, {
    async getSnapshot() {
      return snapshotFixture();
    },
    async generateNarrative() {
      throw new ApplicationError({
        code: 'VALIDATION_FAILED',
        message: 'Internal evidence validation detail.',
      });
    },
  });

  assert.equal(result.narrative, null);
  assert.equal(result.aiSummaryUnavailable, true);
});

test('unexpected snapshot failures are not swallowed', async () => {
  await assert.rejects(
    () =>
      loadDailyBriefingPageData(CONTEXT, {
        async getSnapshot() {
          throw new Error('Database unavailable');
        },
        async generateNarrative() {
          return narrativeFixture();
        },
      }),
    /Database unavailable/,
  );
});

test('isExpectedNarrativeGenerationFailure recognizes provider and application narrative errors', () => {
  assert.equal(
    isExpectedNarrativeGenerationFailure(
      new ProviderError({ code: 'PROVIDER_CONFIGURATION_ERROR', message: 'Missing key.' }),
    ),
    true,
  );
  assert.equal(
    isExpectedNarrativeGenerationFailure(
      new ApplicationError({ code: 'VALIDATION_FAILED', message: 'Invalid evidence.' }),
    ),
    true,
  );
  assert.equal(isExpectedNarrativeGenerationFailure(new Error('Unexpected')), false);
});

test('AI unavailable message is user-safe', () => {
  assert.match(DAILY_BRIEFING_AI_UNAVAILABLE_MESSAGE, /AI summary unavailable/i);
  assert.doesNotMatch(DAILY_BRIEFING_AI_UNAVAILABLE_MESSAGE, /OPENAI|api key|stack/i);
});
