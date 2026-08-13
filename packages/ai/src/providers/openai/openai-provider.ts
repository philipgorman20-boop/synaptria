import type { Clock } from '@synaptria/core';

import { resolveOpenAIApiKey } from '../../config/openai-config';
import { providerConfigurationError, providerUnsupportedCapabilityError } from '../../errors/provider-error';
import { jsonSchemaToRecord } from '../../schema/json-schema';
import {
  parseStructuredJson,
  validateJsonAgainstSchema,
} from '../../schema/validate-json-schema';
import type {
  AIProvider,
  AIProviderExecuteContext,
  AIProviderRequest,
  AIProviderResponse,
} from '../../types/contracts';
import { providerSupportsRequest } from '../../types/contracts';
import type {
  OpenAIClientFactory,
  OpenAIResponsesCreateParams,
  OpenAIResponsesCreateResult,
} from './openai-client-boundary';
import {
  invalidStructuredOutputFromIssues,
  invalidStructuredOutputFromMalformedJson,
  normalizeOpenAIProviderError,
} from './normalize-openai-error';
import { mapOpenAIResponseToProviderResponse } from './map-openai-response';

export interface OpenAIProviderDependencies {
  readonly clientFactory: OpenAIClientFactory;
  readonly clock: Clock;
  readonly getApiKey?: () => string | undefined;
  readonly env?: NodeJS.ProcessEnv;
}

export class OpenAIProvider implements AIProvider {
  readonly providerId = 'openai' as const;
  readonly capabilities = ['plain_text', 'structured_output'] as const;

  constructor(private readonly dependencies: OpenAIProviderDependencies) {}

  supports(request: AIProviderRequest): boolean {
    return providerSupportsRequest(this, request);
  }

  async execute(
    request: AIProviderRequest,
    context: AIProviderExecuteContext,
  ): Promise<AIProviderResponse> {
    if (!this.supports(request)) {
      throw providerUnsupportedCapabilityError(
        `OpenAI provider does not support capability output mode "${request.output.mode}".`,
        { providerId: this.providerId },
      );
    }

    const configuredApiKey = this.dependencies.getApiKey?.();
    const apiKey = resolveOpenAIApiKey({
      ...(configuredApiKey === undefined ? {} : { configuredApiKey }),
      ...(this.dependencies.env === undefined ? {} : { env: this.dependencies.env }),
    });

    if (context.model.trim().length === 0) {
      throw providerConfigurationError(
        'A model must be configured for OpenAI-backed capabilities.',
        { providerId: this.providerId },
      );
    }

    const startedAt = this.dependencies.clock.now();

    try {
      const client = this.dependencies.clientFactory.create(apiKey);
      const params = buildOpenAIResponsesCreateParams(request, context.model);
      const response = await client.create(params);
      const endedAt = this.dependencies.clock.now();
      const durationMs = endedAt.getTime() - startedAt.getTime();

      if (request.output.mode === 'text') {
        return mapOpenAIResponseToProviderResponse({
          response,
          model: context.model,
          durationMs,
          outputMode: 'text',
        });
      }

      return mapStructuredOpenAIResponse({
        response,
        request,
        model: context.model,
        durationMs,
      });
    } catch (error) {
      throw normalizeOpenAIProviderError(error);
    }
  }
}

export function buildOpenAIResponsesCreateParams(
  request: AIProviderRequest,
  model: string,
): OpenAIResponsesCreateParams {
  const baseParams: OpenAIResponsesCreateParams = {
    model,
    input: request.input,
    store: false,
    ...(request.instructions === undefined ? {} : { instructions: request.instructions }),
    ...(request.generationOptions?.temperature === undefined
      ? {}
      : { temperature: request.generationOptions.temperature }),
    ...(request.generationOptions?.maxOutputTokens === undefined
      ? {}
      : { max_output_tokens: request.generationOptions.maxOutputTokens }),
    ...(request.generationOptions?.reasoningEffort === undefined
      ? {}
      : { reasoning: { effort: request.generationOptions.reasoningEffort } }),
  };

  if (request.output.mode !== 'structured') {
    return baseParams;
  }

  return {
    ...baseParams,
    text: {
      format: {
        type: 'json_schema',
        name: request.output.schemaName ?? 'synaptria_structured_output',
        strict: true,
        schema: jsonSchemaToRecord(request.output.schema),
      },
    },
  };
}

function mapStructuredOpenAIResponse(input: {
  readonly response: OpenAIResponsesCreateResult;
  readonly request: AIProviderRequest;
  readonly model: string;
  readonly durationMs: number;
}): AIProviderResponse {
  if (input.request.output.mode !== 'structured') {
    throw new Error('Structured mapping requires a structured request.');
  }

  const base = mapOpenAIResponseToProviderResponse({
    response: input.response,
    model: input.model,
    durationMs: input.durationMs,
    outputMode: 'structured',
  });

  if (base.finishStatus === 'refused' || base.finishStatus === 'incomplete') {
    return base;
  }

  const text = extractResponseText(input.response);
  if (text === undefined) {
    throw invalidStructuredOutputFromIssues(['Structured response did not include output text.']);
  }

  let parsed: unknown;
  try {
    parsed = parseStructuredJson(text);
  } catch (error) {
    throw invalidStructuredOutputFromMalformedJson(error);
  }

  const validation = validateJsonAgainstSchema(parsed, input.request.output.schema);
  if (!validation.valid) {
    throw invalidStructuredOutputFromIssues(
      validation.issues.map((issue) => `${issue.path}: ${issue.message}`),
    );
  }

  return {
    ...base,
    output: {
      mode: 'structured',
      data: parsed,
    },
    validation: {
      valid: true,
    },
  };
}

function extractResponseText(response: OpenAIResponsesCreateResult): string | undefined {
  if (response.output_text !== undefined && response.output_text.length > 0) {
    return response.output_text;
  }

  for (const item of response.output ?? []) {
    for (const content of item.content ?? []) {
      if (content.type === 'output_text' && content.text !== undefined) {
        return content.text;
      }
    }
  }

  return undefined;
}
