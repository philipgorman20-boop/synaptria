import assert from 'node:assert/strict';
import test from 'node:test';

import type { DailyBriefingNarrative, DailyBriefingSnapshot } from '@synaptria/application';
import { ApplicationError } from '@synaptria/application';
import { ProviderError } from '@synaptria/ai';
import { organizationId } from '@synaptria/core';

import {
  DAILY_BRIEFING_AI_UNAVAILABLE_MESSAGE,
  DAILY_BRIEFING_NARRATIVE_LOADING_MESSAGE,
  buildDailyBriefingNarrativeFailureDiagnostic,
  isExpectedNarrativeGenerationFailure,
  loadDailyBriefingSnapshot,
  logDailyBriefingNarrativeFailureDiagnostic,
  logDailyBriefingNarrativeGenerationDiagnostics,
  resolveDailyBriefingNarrative,
  startDailyBriefingNarrativeGeneration,
} from './daily-briefing-loader';

const mutableProcessEnv = process.env as Record<string, string | undefined>;

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
      model: 'gpt-5.4-mini',
      usage: {},
      latencyMs: 10,
    },
  };
}

test('streaming loader loads snapshot independently of narrative generation', async () => {
  const snapshot = snapshotFixture();
  let generateCalls = 0;

  const loadedSnapshot = await loadDailyBriefingSnapshot(CONTEXT, {
    async getSnapshot() {
      return snapshot;
    },
  });

  await resolveDailyBriefingNarrative(loadedSnapshot, {
    async generateNarrative(input) {
      generateCalls += 1;
      assert.equal(input.snapshot, snapshot);
      return narrativeFixture();
    },
  });

  assert.equal(loadedSnapshot, snapshot);
  assert.equal(generateCalls, 1);
});

test('provider failures fall back to deterministic briefing data', async () => {
  const result = await resolveDailyBriefingNarrative(snapshotFixture(), {
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
  const result = await resolveDailyBriefingNarrative(snapshotFixture(), {
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
      loadDailyBriefingSnapshot(CONTEXT, {
        async getSnapshot() {
          throw new Error('Database unavailable');
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

test('narrative loading message is user-safe', () => {
  assert.match(DAILY_BRIEFING_NARRATIVE_LOADING_MESSAGE, /Generating grounded executive summary/i);
  assert.doesNotMatch(DAILY_BRIEFING_NARRATIVE_LOADING_MESSAGE, /OPENAI|api key|error/i);
});

test('loadDailyBriefingSnapshot returns the authoritative snapshot', async () => {
  const snapshot = snapshotFixture();

  const result = await loadDailyBriefingSnapshot(CONTEXT, {
    async getSnapshot() {
      return snapshot;
    },
  });

  assert.equal(result, snapshot);
});

test('startDailyBriefingNarrativeGeneration uses the same snapshot without regenerating it', async () => {
  const snapshot = snapshotFixture();
  let generateCalls = 0;

  const promise = startDailyBriefingNarrativeGeneration(snapshot, {
    async getSnapshot() {
      throw new Error('Snapshot should not be regenerated.');
    },
    async generateNarrative(input) {
      generateCalls += 1;
      assert.equal(input.snapshot, snapshot);
      return narrativeFixture();
    },
  });

  const [first, second] = await Promise.all([promise, promise]);

  assert.equal(generateCalls, 1);
  assert.equal(first.narrative?.headline.text, 'Summary');
  assert.deepEqual(first, second);
});

test('resolveDailyBriefingNarrative failure does not throw and hides provider details', async () => {
  const result = await resolveDailyBriefingNarrative(snapshotFixture(), {
    async generateNarrative() {
      throw new ProviderError({
        code: 'PROVIDER_RATE_LIMIT_ERROR',
        message: 'Rate limit exceeded with secret details.',
        providerId: 'openai',
      });
    },
  });

  assert.equal(result.narrative, null);
  assert.equal(result.aiSummaryUnavailable, true);
});

test('resolveDailyBriefingNarrative returns narrative when generation succeeds', async () => {
  const narrative = narrativeFixture();
  const result = await resolveDailyBriefingNarrative(snapshotFixture(), {
    async generateNarrative() {
      return narrative;
    },
  });

  assert.equal(result.aiSummaryUnavailable, false);
  assert.equal(result.narrative?.executiveSummary.text, 'Summary');
});

test('buildDailyBriefingNarrativeFailureDiagnostic captures safe application error fields', () => {
  const previousNodeEnv = mutableProcessEnv.NODE_ENV;
  mutableProcessEnv.NODE_ENV = 'development';

  try {
    const diagnostic = buildDailyBriefingNarrativeFailureDiagnostic(
      new ApplicationError({
        code: 'VALIDATION_FAILED',
        message: 'Daily Briefing narrative structured output failed schema validation.',
        cause: new ProviderError({
          code: 'PROVIDER_INVALID_STRUCTURED_OUTPUT',
          message: 'Structured output was invalid.',
          providerId: 'openai',
        }),
        details: {
          finishStatus: 'incomplete',
          validationIssues: ['headline.text: Required property'],
          issues: ['headline: must include evidenceKeys'],
        },
      }),
    );

    assert.deepEqual(diagnostic, {
      errorName: 'ApplicationError',
      message: 'Daily Briefing narrative structured output failed schema validation.',
      applicationErrorCode: 'VALIDATION_FAILED',
      providerErrorCode: 'PROVIDER_INVALID_STRUCTURED_OUTPUT',
      finishStatus: 'incomplete',
      validationIssues: ['headline.text: Required property'],
      issues: ['headline: must include evidenceKeys'],
    });
  } finally {
    mutableProcessEnv.NODE_ENV = previousNodeEnv;
  }
});

test('buildDailyBriefingNarrativeFailureDiagnostic captures safe provider error fields', () => {
  const previousNodeEnv = mutableProcessEnv.NODE_ENV;
  mutableProcessEnv.NODE_ENV = 'development';

  try {
    const diagnostic = buildDailyBriefingNarrativeFailureDiagnostic(
      new ProviderError({
        code: 'PROVIDER_RATE_LIMIT_ERROR',
        message: 'Rate limit exceeded.',
        providerId: 'openai',
      }),
    );

    assert.deepEqual(diagnostic, {
      errorName: 'ProviderError',
      message: 'Rate limit exceeded.',
      providerErrorCode: 'PROVIDER_RATE_LIMIT_ERROR',
    });
  } finally {
    mutableProcessEnv.NODE_ENV = previousNodeEnv;
  }
});

test('buildDailyBriefingNarrativeFailureDiagnostic is disabled in production', () => {
  const previousNodeEnv = mutableProcessEnv.NODE_ENV;
  mutableProcessEnv.NODE_ENV = 'production';

  try {
    assert.equal(
      buildDailyBriefingNarrativeFailureDiagnostic(
        new ProviderError({
          code: 'PROVIDER_CONFIGURATION_ERROR',
          message: 'Missing key.',
        }),
      ),
      null,
    );
  } finally {
    mutableProcessEnv.NODE_ENV = previousNodeEnv;
  }
});

test('logDailyBriefingNarrativeFailureDiagnostic writes a concise server diagnostic in development', () => {
  const previousNodeEnv = mutableProcessEnv.NODE_ENV;
  mutableProcessEnv.NODE_ENV = 'development';
  const logs: unknown[][] = [];
  const originalConsoleError = console.error;

  console.error = (...args: unknown[]) => {
    logs.push(args);
  };

  try {
    logDailyBriefingNarrativeFailureDiagnostic(
      new ApplicationError({
        code: 'VALIDATION_FAILED',
        message: 'Internal evidence validation detail.',
        details: {
          issues: ['headline references unknown evidenceKey "entity:Project:missing"'],
        },
      }),
    );

    assert.equal(logs.length, 1);
    assert.equal(logs[0]?.[0], '[daily-briefing] narrative generation unavailable');
    assert.deepEqual(logs[0]?.[1], {
      errorName: 'ApplicationError',
      message: 'Internal evidence validation detail.',
      applicationErrorCode: 'VALIDATION_FAILED',
      issues: ['headline references unknown evidenceKey "entity:Project:missing"'],
    });
  } finally {
    console.error = originalConsoleError;
    mutableProcessEnv.NODE_ENV = previousNodeEnv;
  }
});

test('logDailyBriefingNarrativeGenerationDiagnostics logs safe usage metadata in development', () => {
  const previousNodeEnv = mutableProcessEnv.NODE_ENV;
  mutableProcessEnv.NODE_ENV = 'development';
  const logs: unknown[][] = [];
  const originalConsoleInfo = console.info;

  console.info = (...args: unknown[]) => {
    logs.push(args);
  };

  try {
    logDailyBriefingNarrativeGenerationDiagnostics({
      durationMs: 40123.4,
      provider: 'openai',
      model: 'gpt-5.4-mini',
      inputTokens: 1800,
      outputTokens: 420,
      totalTokens: 2220,
      reasoningTokens: 1024,
      finishStatus: 'completed',
    });

    assert.equal(logs.length, 1);
    assert.match(String(logs[0]?.[0]), /durationMs=40123/);
    assert.match(String(logs[0]?.[0]), /provider=openai/);
    assert.match(String(logs[0]?.[0]), /model=gpt-5.4-mini/);
    assert.match(String(logs[0]?.[0]), /inputTokens=1800/);
    assert.match(String(logs[0]?.[0]), /outputTokens=420/);
    assert.match(String(logs[0]?.[0]), /totalTokens=2220/);
    assert.match(String(logs[0]?.[0]), /reasoningTokens=1024/);
    assert.match(String(logs[0]?.[0]), /finishStatus=completed/);
  } finally {
    console.info = originalConsoleInfo;
    mutableProcessEnv.NODE_ENV = previousNodeEnv;
  }
});

test('logDailyBriefingNarrativeGenerationDiagnostics remains silent in production', () => {
  const previousNodeEnv = mutableProcessEnv.NODE_ENV;
  mutableProcessEnv.NODE_ENV = 'production';
  const logs: unknown[][] = [];
  const originalConsoleInfo = console.info;

  console.info = (...args: unknown[]) => {
    logs.push(args);
  };

  try {
    logDailyBriefingNarrativeGenerationDiagnostics({
      durationMs: 1000,
      provider: 'openai',
      model: 'gpt-5.4-mini',
      finishStatus: 'completed',
    });

    assert.equal(logs.length, 0);
  } finally {
    console.info = originalConsoleInfo;
    mutableProcessEnv.NODE_ENV = previousNodeEnv;
  }
});

test('resolveDailyBriefingNarrative logs generation diagnostics without prompt or output content', async () => {
  const previousNodeEnv = mutableProcessEnv.NODE_ENV;
  mutableProcessEnv.NODE_ENV = 'development';
  const logs: unknown[][] = [];
  const originalConsoleInfo = console.info;

  console.info = (...args: unknown[]) => {
    logs.push(args);
  };

  try {
    await resolveDailyBriefingNarrative(snapshotFixture(), {
      async generateNarrative() {
        return {
          ...narrativeFixture(),
          generation: {
            provider: 'openai',
            model: 'gpt-5.4-mini',
            usage: {
              inputTokens: 900,
              outputTokens: 200,
              totalTokens: 1100,
              reasoningTokens: 512,
            },
            latencyMs: 35000,
          },
        };
      },
    });

    assert.equal(logs.length, 1);
    const message = String(logs[0]?.[0]);
    assert.match(message, /inputTokens=900/);
    assert.match(message, /reasoningTokens=512/);
    assert.match(message, /finishStatus=completed/);
    assert.doesNotMatch(message, /Summary/);
  } finally {
    console.info = originalConsoleInfo;
    mutableProcessEnv.NODE_ENV = previousNodeEnv;
  }
});
