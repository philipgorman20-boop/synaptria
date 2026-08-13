import { SystemClock } from '@synaptria/core';
import { createAIProviderService } from '@synaptria/ai';
import { DAILY_BRIEFING_NARRATIVE_CAPABILITY_ID } from '@synaptria/application';

const configuredModel =
  process.env.OPENAI_MODEL === undefined || process.env.OPENAI_MODEL.trim().length === 0
    ? undefined
    : process.env.OPENAI_MODEL.trim();

const routing =
  configuredModel === undefined
    ? { routes: {} }
    : {
        routes: {
          [DAILY_BRIEFING_NARRATIVE_CAPABILITY_ID]: {
            providerId: 'openai' as const,
            model: configuredModel,
          },
        },
        defaultRoute: {
          providerId: 'openai' as const,
          model: configuredModel,
        },
      };

const aiProviderService = createAIProviderService({
  clock: new SystemClock(),
  routing,
  openai: {
    getApiKey: () => process.env.OPENAI_API_KEY,
    env: process.env,
  },
});

/** Shared server-side composition root for the AI Provider Platform. */
export function getAIProviderService() {
  return aiProviderService;
}
