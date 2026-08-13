import { SystemClock } from '@synaptria/core';
import { createAIProviderService } from '@synaptria/ai';

const routing =
  process.env.OPENAI_MODEL === undefined || process.env.OPENAI_MODEL.trim().length === 0
    ? { routes: {} }
    : {
        routes: {},
        defaultRoute: {
          providerId: 'openai' as const,
          model: process.env.OPENAI_MODEL.trim(),
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
