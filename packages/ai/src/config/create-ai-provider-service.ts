import type { Clock } from '@synaptria/core';

import type { ProviderRoutingConfig } from '../routing/router';
import { DeterministicProviderRouter } from '../routing/router';
import { ProviderRegistry } from '../routing/provider-registry';
import { OpenAIProvider } from '../providers/openai/openai-provider';
import { createDefaultOpenAIClientFactory } from '../providers/openai/openai-client-factory';
import { AIProviderService } from '../service/ai-provider-service';
import type { AIProvider } from '../types/contracts';

export interface CreateAIProviderServiceInput {
  readonly clock: Clock;
  readonly routing: ProviderRoutingConfig;
  readonly providers?: readonly AIProvider[];
  readonly openai?: {
    readonly getApiKey?: () => string | undefined;
    readonly env?: NodeJS.ProcessEnv;
  };
}

export function createAIProviderService(input: CreateAIProviderServiceInput): AIProviderService {
  const registry = new ProviderRegistry();
  const router = new DeterministicProviderRouter(input.routing);

  const providers =
    input.providers ??
    [
      new OpenAIProvider({
        clientFactory: createDefaultOpenAIClientFactory(),
        clock: input.clock,
        ...(input.openai?.getApiKey === undefined ? {} : { getApiKey: input.openai.getApiKey }),
        ...(input.openai?.env === undefined ? {} : { env: input.openai.env }),
      }),
    ];

  for (const provider of providers) {
    registry.register(provider);
  }

  return new AIProviderService(router, registry);
}
