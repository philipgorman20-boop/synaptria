import assert from 'node:assert/strict';
import test from 'node:test';

import { ProviderError } from '@synaptria/ai';
import type { AIProviderRequest, AIProviderResponse } from '@synaptria/ai';

import { ApplicationError } from '../../../shared/application-error';
import {
  DAILY_BRIEFING_NARRATIVE_CAPABILITY_ID,
  DAILY_BRIEFING_NARRATIVE_MAX_OUTPUT_TOKENS,
  DAILY_BRIEFING_NARRATIVE_REASONING_EFFORT,
} from './capability';
import { GenerateDailyBriefingNarrativeUseCase } from './generate-daily-briefing-narrative';
import {
  mapDailyBriefingSnapshotToModelInput,
  serializeDailyBriefingNarrativeModelInput,
} from './map-model-input';
import { DAILY_BRIEFING_NARRATIVE_V0_JSON_SCHEMA } from './schema';
import { validateDailyBriefingNarrativeEvidence } from './validate-narrative-evidence';
import {
  dailyBriefingSnapshotFixture,
  emptyDailyBriefingSnapshotFixture,
  emptyGroundedNarrativePayload,
  groundedNarrativePayload,
} from './testing/fixtures';
import type { DailyBriefingAIProviderPort } from './ai-provider-port';

const TEST_MODEL = 'gpt-4o-mini';

function createMockProvider(
  handler: (request: AIProviderRequest) => Promise<AIProviderResponse>,
): DailyBriefingAIProviderPort {
  return { execute: handler };
}

function structuredProviderResponse(
  data: unknown,
  overrides: Partial<AIProviderResponse> = {},
): AIProviderResponse {
  return {
    provider: 'openai',
    model: TEST_MODEL,
    output: { mode: 'structured', data },
    usage: { inputTokens: 100, outputTokens: 50, totalTokens: 150 },
    latency: { durationMs: 250 },
    finishStatus: 'completed',
    validation: { valid: true },
    ...overrides,
  };
}

test('mapDailyBriefingSnapshotToModelInput is deterministic and uses compact narrative projection', () => {
  const snapshot = dailyBriefingSnapshotFixture();
  const first = serializeDailyBriefingNarrativeModelInput(
    mapDailyBriefingSnapshotToModelInput(snapshot),
  );
  const second = serializeDailyBriefingNarrativeModelInput(
    mapDailyBriefingSnapshotToModelInput(snapshot),
  );

  assert.equal(first, second);
  const parsed = JSON.parse(first) as ReturnType<typeof mapDailyBriefingSnapshotToModelInput>;
  assert.equal(parsed.capabilityVersion, 'v0');
  assert.equal(parsed.attentionItems.length, 1);
  assert.equal(parsed.attentionItems[0]?.evidenceKey, 'entity:Task:task-1');
  assert.deepEqual(parsed.evidenceCatalog.map((entry) => entry.key), [
    'entity:Milestone:milestone-1',
    'entity:Project:project-1',
    'entity:Task:task-1',
    'event:event-1',
  ]);
  assert.ok(parsed.evidenceCatalog.every((entry) => typeof entry.label === 'string'));
  assert.deepEqual(parsed.narrativeTargets.attentionEvidenceKeys, ['entity:Task:task-1']);
  assert.equal('executiveSignals' in parsed, false);
  assert.equal('organizationId' in parsed, false);
});

test('narrative schema requires grounded headline, summary, factual item arrays, and completenessNote', () => {
  assert.deepEqual(DAILY_BRIEFING_NARRATIVE_V0_JSON_SCHEMA.required, [
    'headline',
    'executiveSummary',
    'attentionItems',
    'projectHighlightItems',
    'upcomingWorkItems',
    'recentChangeItems',
    'completenessNote',
  ]);
  assert.equal(DAILY_BRIEFING_NARRATIVE_V0_JSON_SCHEMA.properties?.headline?.type, 'object');
  assert.deepEqual(
    DAILY_BRIEFING_NARRATIVE_V0_JSON_SCHEMA.properties?.completenessNote?.type,
    ['string', 'null'],
  );
});

test('successful grounded rendering returns validated headline and summary blocks', async () => {
  const requests: AIProviderRequest[] = [];
  const useCase = new GenerateDailyBriefingNarrativeUseCase(
    createMockProvider(async (request) => {
      requests.push(request);
      return structuredProviderResponse(groundedNarrativePayload());
    }),
  );

  const snapshot = dailyBriefingSnapshotFixture();
  const narrative = await useCase.execute({ snapshot });

  assert.equal(narrative.capabilityId, DAILY_BRIEFING_NARRATIVE_CAPABILITY_ID);
  assert.equal(narrative.headline.text, 'Alpha Study needs attention');
  assert.deepEqual(narrative.headline.evidenceKeys, ['entity:Project:project-1']);
  assert.equal(
    narrative.executiveSummary.text,
    'One overdue task and one due-soon milestone require follow-up.',
  );
  assert.equal(requests[0]?.capabilityId, DAILY_BRIEFING_NARRATIVE_CAPABILITY_ID);
  assert.equal(requests[0]?.output.mode, 'structured');
  assert.equal(requests[0]?.dataHandling.storeResponse, false);
  assert.equal(
    requests[0]?.generationOptions?.maxOutputTokens,
    DAILY_BRIEFING_NARRATIVE_MAX_OUTPUT_TOKENS,
  );
  assert.equal(
    requests[0]?.generationOptions?.reasoningEffort,
    DAILY_BRIEFING_NARRATIVE_REASONING_EFFORT,
  );
  assert.equal(DAILY_BRIEFING_NARRATIVE_MAX_OUTPUT_TOKENS, 3000);
  assert.equal(narrative.generation.model, TEST_MODEL);
});

test('generateDailyBriefingNarrativeUseCase makes exactly one provider request per execution', async () => {
  let executeCalls = 0;
  const useCase = new GenerateDailyBriefingNarrativeUseCase(
    createMockProvider(async () => {
      executeCalls += 1;
      return structuredProviderResponse(groundedNarrativePayload());
    }),
  );

  await useCase.execute({ snapshot: dailyBriefingSnapshotFixture() });
  assert.equal(executeCalls, 1);
});

test('validateDailyBriefingNarrativeEvidence accepts grounded headline and summary', () => {
  const snapshot = dailyBriefingSnapshotFixture();

  assert.doesNotThrow(() =>
    validateDailyBriefingNarrativeEvidence({
      narrative: groundedNarrativePayload(),
      snapshot,
    }),
  );
});

test('fabricated headline evidence references are rejected', () => {
  const snapshot = dailyBriefingSnapshotFixture();

  assert.throws(
    () =>
      validateDailyBriefingNarrativeEvidence({
        narrative: {
          ...groundedNarrativePayload(),
          headline: {
            text: 'Fabricated headline.',
            evidenceKeys: ['entity:Project:missing-project'],
          },
        },
        snapshot,
      }),
    (error: unknown) => {
      assert.ok(error instanceof ApplicationError);
      assert.match(String(error.details?.issues), /headline references unknown evidenceKey/);
      return true;
    },
  );
});

test('fabricated summary evidence references are rejected', () => {
  const snapshot = dailyBriefingSnapshotFixture();

  assert.throws(
    () =>
      validateDailyBriefingNarrativeEvidence({
        narrative: {
          ...groundedNarrativePayload(),
          executiveSummary: {
            text: 'Fabricated summary.',
            evidenceKeys: ['event:missing-event'],
          },
        },
        snapshot,
      }),
    (error: unknown) => {
      assert.ok(error instanceof ApplicationError);
      assert.match(String(error.details?.issues), /executiveSummary references unknown evidenceKey/);
      return true;
    },
  );
});

test('missing headline evidence on populated briefings is rejected', () => {
  const snapshot = dailyBriefingSnapshotFixture();

  assert.throws(
    () =>
      validateDailyBriefingNarrativeEvidence({
        narrative: {
          ...groundedNarrativePayload(),
          headline: {
            text: 'Alpha Study needs attention',
            evidenceKeys: [],
          },
        },
        snapshot,
      }),
    (error: unknown) => {
      assert.ok(error instanceof ApplicationError);
      assert.match(String(error.details?.issues), /headline must include at least one evidenceKey/);
      return true;
    },
  );
});

test('missing summary evidence on populated briefings is rejected', () => {
  const snapshot = dailyBriefingSnapshotFixture();

  assert.throws(
    () =>
      validateDailyBriefingNarrativeEvidence({
        narrative: {
          ...groundedNarrativePayload(),
          executiveSummary: {
            text: 'One overdue task requires follow-up.',
            evidenceKeys: [],
          },
        },
        snapshot,
      }),
    (error: unknown) => {
      assert.ok(error instanceof ApplicationError);
      assert.match(
        String(error.details?.issues),
        /executiveSummary must include at least one evidenceKey/,
      );
      return true;
    },
  );
});

test('valid empty-briefing neutral headline and summary may use zero evidence keys', async () => {
  const useCase = new GenerateDailyBriefingNarrativeUseCase(
    createMockProvider(async () => structuredProviderResponse(emptyGroundedNarrativePayload())),
  );

  const narrative = await useCase.execute({ snapshot: emptyDailyBriefingSnapshotFixture() });

  assert.equal(narrative.headline.evidenceKeys.length, 0);
  assert.equal(narrative.executiveSummary.evidenceKeys.length, 0);
  assert.match(narrative.headline.text, /No material execution activity/i);
});

test('hallucinated item evidence references are rejected', () => {
  const snapshot = dailyBriefingSnapshotFixture();

  assert.throws(
    () =>
      validateDailyBriefingNarrativeEvidence({
        narrative: {
          ...groundedNarrativePayload(),
          attentionItems: [
            {
              text: 'Fabricated claim.',
              evidenceKeys: ['entity:Task:missing-task'],
            },
          ],
        },
        snapshot,
      }),
    (error: unknown) => {
      assert.ok(error instanceof ApplicationError);
      assert.equal(error.code, 'VALIDATION_FAILED');
      return true;
    },
  );
});

test('incomplete provider responses fail closed', async () => {
  const useCase = new GenerateDailyBriefingNarrativeUseCase(
    createMockProvider(async () =>
      structuredProviderResponse(groundedNarrativePayload(), {
        finishStatus: 'incomplete',
        validation: { valid: false, issues: ['max_output_tokens'] },
      }),
    ),
  );

  await assert.rejects(
    () => useCase.execute({ snapshot: dailyBriefingSnapshotFixture() }),
    (error: unknown) => {
      assert.ok(error instanceof ApplicationError);
      assert.equal(error.code, 'VALIDATION_FAILED');
      assert.match(error.message, /incomplete/i);
      return true;
    },
  );
});

test('refused provider responses fail closed', async () => {
  const useCase = new GenerateDailyBriefingNarrativeUseCase(
    createMockProvider(async () =>
      structuredProviderResponse(groundedNarrativePayload(), {
        finishStatus: 'refused',
        validation: { valid: false },
      }),
    ),
  );

  await assert.rejects(
    () => useCase.execute({ snapshot: dailyBriefingSnapshotFixture() }),
    (error: unknown) => {
      assert.ok(error instanceof ApplicationError);
      assert.equal(error.code, 'VALIDATION_FAILED');
      return true;
    },
  );
});

test('provider errors are normalized into application errors', async () => {
  const useCase = new GenerateDailyBriefingNarrativeUseCase(
    createMockProvider(async () => {
      throw new ProviderError({
        code: 'PROVIDER_RATE_LIMIT_ERROR',
        message: 'Rate limit exceeded.',
        providerId: 'openai',
      });
    }),
  );

  await assert.rejects(
    () => useCase.execute({ snapshot: dailyBriefingSnapshotFixture() }),
    (error: unknown) => {
      assert.ok(error instanceof ApplicationError);
      assert.equal(error.code, 'VALIDATION_FAILED');
      assert.ok(error.cause instanceof ProviderError);
      return true;
    },
  );
});

test('schema violations in structured output fail closed', async () => {
  const useCase = new GenerateDailyBriefingNarrativeUseCase(
    createMockProvider(async () =>
      structuredProviderResponse({
        headline: { text: 'Missing required sections' },
      }),
    ),
  );

  await assert.rejects(
    () => useCase.execute({ snapshot: dailyBriefingSnapshotFixture() }),
    (error: unknown) => {
      assert.ok(error instanceof ApplicationError);
      assert.match(error.message, /schema validation/i);
      return true;
    },
  );
});

test('degraded snapshots are passed through model input without altering operational facts', () => {
  const snapshot = dailyBriefingSnapshotFixture({
    executiveSignals: {
      activeProjects: null,
      projectsAtRisk: null,
      overdueTasks: null,
      blockedTasks: null,
      overdueMilestones: null,
      dueSoonMilestones: null,
      dueSoonTasks: null,
      recentOrganizationEvents: null,
      changedProjectCount: null,
    },
    attentionItems: [],
    projectHighlights: [],
    upcomingWork: [],
    recentChanges: [],
    evidence: [],
    completeness: {
      status: 'insufficient',
      degradationNotes: ['Mission Control projects data is unavailable due to access permissions.'],
    },
    metadata: {
      deterministic: true,
      restrictedSlices: ['projects', 'milestones', 'tasks', 'recentActivity'],
      missionControlGeneratedAt: new Date('2026-07-26T12:00:00.000Z'),
    },
  });

  const modelInput = mapDailyBriefingSnapshotToModelInput(snapshot);
  assert.equal(modelInput.completeness.status, 'insufficient');
  assert.equal(modelInput.attentionItems.length, 0);
  assert.deepEqual(modelInput.restrictedSlices, [
    'projects',
    'milestones',
    'tasks',
    'recentActivity',
  ]);
});

test('empty briefing data maps to an empty-but-valid model input', () => {
  const snapshot = emptyDailyBriefingSnapshotFixture();
  const modelInput = mapDailyBriefingSnapshotToModelInput(snapshot);
  assert.equal(modelInput.evidenceCatalog.length, 0);
  assert.equal(modelInput.attentionItems.length, 0);
});

test('repeatability returns equivalent narratives for identical snapshot and provider output', async () => {
  const useCase = new GenerateDailyBriefingNarrativeUseCase(
    createMockProvider(async () => structuredProviderResponse(groundedNarrativePayload())),
  );
  const snapshot = dailyBriefingSnapshotFixture();

  const first = await useCase.execute({ snapshot });
  const second = await useCase.execute({ snapshot });

  assert.deepEqual(
    {
      headline: first.headline,
      executiveSummary: first.executiveSummary,
      attentionItems: first.attentionItems,
      projectHighlightItems: first.projectHighlightItems,
      upcomingWorkItems: first.upcomingWorkItems,
      recentChangeItems: first.recentChangeItems,
    },
    {
      headline: second.headline,
      executiveSummary: second.executiveSummary,
      attentionItems: second.attentionItems,
      projectHighlightItems: second.projectHighlightItems,
      upcomingWorkItems: second.upcomingWorkItems,
      recentChangeItems: second.recentChangeItems,
    },
  );
});

test('populated briefings reject zero-evidence headline and summary even when item arrays are empty', () => {
  const snapshot = dailyBriefingSnapshotFixture({
    attentionItems: [],
    projectHighlights: [],
    upcomingWork: [],
    recentChanges: [],
  });

  assert.throws(
    () =>
      validateDailyBriefingNarrativeEvidence({
        narrative: {
          headline: { text: 'Operational claim without evidence.', evidenceKeys: [] },
          executiveSummary: { text: 'Another operational claim.', evidenceKeys: [] },
          attentionItems: [],
          projectHighlightItems: [],
          upcomingWorkItems: [],
          recentChangeItems: [],
          completenessNote: null,
        },
        snapshot,
      }),
    (error: unknown) => {
      assert.ok(error instanceof ApplicationError);
      assert.match(String(error.details?.issues), /headline must include at least one evidenceKey/);
      assert.match(
        String(error.details?.issues),
        /executiveSummary must include at least one evidenceKey/,
      );
      return true;
    },
  );
});
