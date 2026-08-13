import type { DailyBriefingSnapshot } from '../types';
import type { DailyBriefingAIProviderPort } from './ai-provider-port';
import {
  DAILY_BRIEFING_NARRATIVE_CAPABILITY_ID,
  DAILY_BRIEFING_NARRATIVE_MAX_OUTPUT_TOKENS,
  DAILY_BRIEFING_NARRATIVE_REASONING_EFFORT,
  DAILY_BRIEFING_NARRATIVE_SCHEMA_NAME,
} from './capability';
import { DAILY_BRIEFING_NARRATIVE_INSTRUCTIONS } from './instructions';
import {
  mapDailyBriefingSnapshotToModelInput,
  serializeDailyBriefingNarrativeModelInput,
} from './map-model-input';
import {
  assertSuccessfulDailyBriefingProviderResponse,
  mapDailyBriefingNarrativeProviderError,
  parseDailyBriefingNarrativeStructuredOutput,
} from './provider-response';
import { DAILY_BRIEFING_NARRATIVE_V0_JSON_SCHEMA } from './schema';
import type { DailyBriefingNarrative } from './types';
import { validateDailyBriefingNarrativeEvidence } from './validate-narrative-evidence';

export interface GenerateDailyBriefingNarrativeInput {
  readonly snapshot: DailyBriefingSnapshot;
}

export class GenerateDailyBriefingNarrativeUseCase {
  constructor(private readonly aiProvider: DailyBriefingAIProviderPort) {}

  async execute(input: GenerateDailyBriefingNarrativeInput): Promise<DailyBriefingNarrative> {
    const modelInput = mapDailyBriefingSnapshotToModelInput(input.snapshot);

    try {
      const response = await this.aiProvider.execute({
        capabilityId: DAILY_BRIEFING_NARRATIVE_CAPABILITY_ID,
        input: serializeDailyBriefingNarrativeModelInput(modelInput),
        instructions: DAILY_BRIEFING_NARRATIVE_INSTRUCTIONS,
        output: {
          mode: 'structured',
          schema: DAILY_BRIEFING_NARRATIVE_V0_JSON_SCHEMA,
          schemaName: DAILY_BRIEFING_NARRATIVE_SCHEMA_NAME,
        },
        generationOptions: {
          maxOutputTokens: DAILY_BRIEFING_NARRATIVE_MAX_OUTPUT_TOKENS,
          reasoningEffort: DAILY_BRIEFING_NARRATIVE_REASONING_EFFORT,
        },
        dataHandling: {
          storeResponse: false,
          classification: 'internal',
        },
        metadata: {
          organizationId: input.snapshot.organization.organizationId,
          snapshotGeneratedAt: input.snapshot.generatedAt.toISOString(),
        },
      });

      assertSuccessfulDailyBriefingProviderResponse(response);

      if (response.output.mode !== 'structured') {
        throw new Error('Structured output expected after provider validation.');
      }

      const structured = parseDailyBriefingNarrativeStructuredOutput(response.output.data);
      validateDailyBriefingNarrativeEvidence({
        narrative: structured,
        snapshot: input.snapshot,
      });

      return {
        capabilityId: DAILY_BRIEFING_NARRATIVE_CAPABILITY_ID,
        headline: structured.headline,
        executiveSummary: structured.executiveSummary,
        attentionItems: structured.attentionItems,
        projectHighlightItems: structured.projectHighlightItems,
        upcomingWorkItems: structured.upcomingWorkItems,
        recentChangeItems: structured.recentChangeItems,
        ...(structured.completenessNote === null
          ? {}
          : { completenessNote: structured.completenessNote }),
        sourceSnapshotGeneratedAt: input.snapshot.generatedAt,
        generation: {
          provider: response.provider,
          model: response.model,
          usage: response.usage,
          latencyMs: response.latency.durationMs,
        },
      };
    } catch (error) {
      throw mapDailyBriefingNarrativeProviderError(error);
    }
  }
}
