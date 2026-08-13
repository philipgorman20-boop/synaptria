import type { AIProviderId } from '../constants';
import { providerConfigurationError } from '../errors/provider-error';

export interface OpenAIProviderEnvironmentConfig {
  readonly apiKey?: string;
  readonly model?: string;
}

export function readOpenAIProviderEnvironmentConfig(
  env: NodeJS.ProcessEnv = process.env,
): OpenAIProviderEnvironmentConfig {
  return {
    ...(env.OPENAI_API_KEY === undefined ? {} : { apiKey: env.OPENAI_API_KEY }),
    ...(env.OPENAI_MODEL === undefined ? {} : { model: env.OPENAI_MODEL }),
  };
}

export function resolveOpenAIApiKey(input: {
  readonly configuredApiKey?: string;
  readonly env?: NodeJS.ProcessEnv;
}): string {
  const apiKey = input.configuredApiKey ?? readOpenAIProviderEnvironmentConfig(input.env).apiKey;
  if (apiKey === undefined || apiKey.trim().length === 0) {
    throw providerConfigurationError(
      'OPENAI_API_KEY is required to execute OpenAI-backed capabilities.',
      { providerId: 'openai' satisfies AIProviderId },
    );
  }

  return apiKey.trim();
}

export function resolveOpenAIModel(input: {
  readonly configuredModel?: string;
  readonly env?: NodeJS.ProcessEnv;
}): string {
  const model = input.configuredModel ?? readOpenAIProviderEnvironmentConfig(input.env).model;
  if (model === undefined || model.trim().length === 0) {
    throw providerConfigurationError(
      'OPENAI_MODEL is required to execute OpenAI-backed capabilities.',
      { providerId: 'openai' satisfies AIProviderId },
    );
  }

  return model.trim();
}
