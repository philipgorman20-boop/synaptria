import assert from 'node:assert/strict';
import test from 'node:test';

import { FixedClock } from '@synaptria/core';

import {
  AIProviderService,
  buildOpenAIResponsesCreateParams,
  createAIProviderService,
  OpenAIProvider,
  ProviderError,
  ProviderRegistry,
  DeterministicProviderRouter,
} from '../index';
import type {
  OpenAIResponsesClient,
  OpenAIResponsesCreateParams,
  OpenAIResponsesCreateResult,
} from '../providers/openai/openai-client-boundary';
import { FakeAIProvider, textProviderResponse } from '../testing/fake-provider';
import type { AIProviderRequest } from '../types/contracts';

const CLOCK = new FixedClock(new Date('2026-07-26T12:00:00.000Z'));
const TEST_MODEL = 'gpt-4o-mini';

const SUMMARY_SCHEMA = {
  type: 'object',
  properties: {
    headline: { type: 'string' },
    priority: { type: 'string' },
  },
  required: ['headline', 'priority'],
  additionalProperties: false,
} as const;

function baseRequest(
  overrides: Partial<AIProviderRequest> & Pick<AIProviderRequest, 'capabilityId' | 'output'>,
): AIProviderRequest {
  return {
    input: 'Summarize the portfolio status.',
    dataHandling: { storeResponse: false },
    ...overrides,
  };
}

function createServiceWithFakeOpenAI(
  handler: (params: OpenAIResponsesCreateParams) => Promise<OpenAIResponsesCreateResult>,
) {
  const captured: OpenAIResponsesCreateParams[] = [];
  const client: OpenAIResponsesClient = {
    async create(params) {
      captured.push(params);
      return handler(params);
    },
  };

  const provider = new OpenAIProvider({
    clientFactory: { create: () => client },
    clock: CLOCK,
    getApiKey: () => 'test-api-key',
  });

  const registry = new ProviderRegistry();
  registry.register(provider);

  const service = new AIProviderService(
    new DeterministicProviderRouter({
      routes: {
        'test.text': { providerId: 'openai', model: TEST_MODEL },
        'test.structured': { providerId: 'openai', model: TEST_MODEL },
      },
    }),
    registry,
  );

  return { service, captured };
}

function completedOpenAIResponse(
  overrides: Partial<OpenAIResponsesCreateResult> = {},
): OpenAIResponsesCreateResult {
  return {
    id: 'resp-1',
    model: TEST_MODEL,
    status: 'completed',
    output_text: 'Portfolio is stable.',
    usage: {
      input_tokens: 12,
      output_tokens: 8,
      total_tokens: 20,
    },
    ...overrides,
  };
}

test('plain-text request/response is normalized through the provider service', async () => {
  const { service } = createServiceWithFakeOpenAI(async () => completedOpenAIResponse());

  const response = await service.execute(
    baseRequest({
      capabilityId: 'test.text',
      output: { mode: 'text' },
    }),
  );

  assert.equal(response.output.mode, 'text');
  if (response.output.mode === 'text') {
    assert.equal(response.output.text, 'Portfolio is stable.');
  }
  assert.equal(response.finishStatus, 'completed');
});

test('structured-output request/response validates and returns schema-conformant data', async () => {
  const { service } = createServiceWithFakeOpenAI(async () =>
    completedOpenAIResponse({
      output_text: JSON.stringify({ headline: 'Two projects at risk', priority: 'high' }),
    }),
  );

  const response = await service.execute(
    baseRequest({
      capabilityId: 'test.structured',
      output: { mode: 'structured', schema: SUMMARY_SCHEMA, schemaName: 'brief_summary' },
    }),
  );

  assert.equal(response.output.mode, 'structured');
  if (response.output.mode === 'structured') {
    assert.deepEqual(response.output.data, {
      headline: 'Two projects at risk',
      priority: 'high',
    });
  }
  assert.equal(response.validation.valid, true);
});

test('deterministic routing selects configured provider and model', async () => {
  const fake = new FakeAIProvider('openai', ['plain_text'], async (_request, context) =>
    textProviderResponse({ model: context.model, output: { mode: 'text', text: 'routed' } }),
  );

  const registry = new ProviderRegistry();
  registry.register(fake);

  const service = new AIProviderService(
    new DeterministicProviderRouter({
      routes: {
        'capability.a': { providerId: 'openai', model: 'model-a' },
        'capability.b': { providerId: 'openai', model: 'model-b' },
      },
    }),
    registry,
  );

  await service.execute(
    baseRequest({ capabilityId: 'capability.b', output: { mode: 'text' } }),
  );

  assert.equal(fake.calls[0]?.context.model, 'model-b');
});

test('configured model selection is passed to the provider adapter', async () => {
  const { service, captured } = createServiceWithFakeOpenAI(async () => completedOpenAIResponse());

  await service.execute(
    baseRequest({ capabilityId: 'test.text', output: { mode: 'text' } }),
  );

  assert.equal(captured[0]?.model, TEST_MODEL);
});

test('unsupported capability route fails with a typed provider error', async () => {
  const service = createAIProviderService({
    clock: CLOCK,
    routing: { routes: {} },
    openai: { getApiKey: () => 'test-api-key' },
  });

  await assert.rejects(
    () =>
      service.execute(
        baseRequest({ capabilityId: 'missing.capability', output: { mode: 'text' } }),
      ),
    (error: unknown) => {
      assert.ok(error instanceof ProviderError);
      assert.equal(error.code, 'PROVIDER_UNSUPPORTED_CAPABILITY');
      return true;
    },
  );
});

test('missing provider registration fails with a typed provider error', async () => {
  const service = new AIProviderService(
    new DeterministicProviderRouter({
      routes: { 'test.text': { providerId: 'openai', model: TEST_MODEL } },
    }),
    new ProviderRegistry(),
  );

  await assert.rejects(
    () => service.execute(baseRequest({ capabilityId: 'test.text', output: { mode: 'text' } })),
    (error: unknown) => {
      assert.ok(error instanceof ProviderError);
      assert.equal(error.code, 'PROVIDER_NOT_FOUND');
      return true;
    },
  );
});

test('missing OpenAI API key fails with a configuration error at execution time', async () => {
  const provider = new OpenAIProvider({
    clientFactory: { create: () => ({ create: async () => completedOpenAIResponse() }) },
    clock: CLOCK,
    getApiKey: () => undefined,
  });

  await assert.rejects(
    () =>
      provider.execute(
        baseRequest({ capabilityId: 'test.text', output: { mode: 'text' } }),
        { model: TEST_MODEL },
      ),
    (error: unknown) => {
      assert.ok(error instanceof ProviderError);
      assert.equal(error.code, 'PROVIDER_CONFIGURATION_ERROR');
      return true;
    },
  );
});

test('normalized usage metadata preserves absent fields explicitly', async () => {
  const { service } = createServiceWithFakeOpenAI(async () =>
    completedOpenAIResponse({ usage: { input_tokens: 7 } }),
  );

  const response = await service.execute(
    baseRequest({ capabilityId: 'test.text', output: { mode: 'text' } }),
  );

  assert.equal(response.usage.inputTokens, 7);
  assert.equal(response.usage.outputTokens, undefined);
  assert.equal(response.usage.totalTokens, undefined);
  assert.equal(response.usage.reasoningTokens, undefined);
});

test('normalized latency is measured with the injected clock', async () => {
  let callCount = 0;
  const clock = {
    now() {
      callCount += 1;
      return callCount === 1
        ? new Date('2026-07-26T12:00:00.000Z')
        : new Date('2026-07-26T12:00:01.250Z');
    },
  };

  const provider = new OpenAIProvider({
    clientFactory: {
      create: () => ({
        create: async () => completedOpenAIResponse(),
      }),
    },
    clock,
    getApiKey: () => 'test-api-key',
  });

  const response = await provider.execute(
    baseRequest({ capabilityId: 'test.text', output: { mode: 'text' } }),
    { model: TEST_MODEL },
  );

  assert.equal(response.latency.durationMs, 1250);
});

test('provider authentication errors are normalized', async () => {
  const provider = new OpenAIProvider({
    clientFactory: {
      create: () => ({
        create: async () => {
          throw { name: 'APIError', status: 401, message: 'invalid api key' };
        },
      }),
    },
    clock: CLOCK,
    getApiKey: () => 'test-api-key',
  });

  await assert.rejects(
    () =>
      provider.execute(
        baseRequest({ capabilityId: 'test.text', output: { mode: 'text' } }),
        { model: TEST_MODEL },
      ),
    (error: unknown) => {
      assert.ok(error instanceof ProviderError);
      assert.equal(error.code, 'PROVIDER_AUTHENTICATION_ERROR');
      return true;
    },
  );
});

test('rate-limit errors are normalized', async () => {
  const provider = new OpenAIProvider({
    clientFactory: {
      create: () => ({
        create: async () => {
          throw { name: 'APIError', status: 429, message: 'rate limit' };
        },
      }),
    },
    clock: CLOCK,
    getApiKey: () => 'test-api-key',
  });

  await assert.rejects(
    () =>
      provider.execute(
        baseRequest({ capabilityId: 'test.text', output: { mode: 'text' } }),
        { model: TEST_MODEL },
      ),
    (error: unknown) => {
      assert.ok(error instanceof ProviderError);
      assert.equal(error.code, 'PROVIDER_RATE_LIMIT_ERROR');
      return true;
    },
  );
});

test('timeout and network errors are normalized', async () => {
  const provider = new OpenAIProvider({
    clientFactory: {
      create: () => ({
        create: async () => {
          throw { name: 'APIConnectionError', message: 'connection failed' };
        },
      }),
    },
    clock: CLOCK,
    getApiKey: () => 'test-api-key',
  });

  await assert.rejects(
    () =>
      provider.execute(
        baseRequest({ capabilityId: 'test.text', output: { mode: 'text' } }),
        { model: TEST_MODEL },
      ),
    (error: unknown) => {
      assert.ok(error instanceof ProviderError);
      assert.equal(error.code, 'PROVIDER_TIMEOUT_ERROR');
      return true;
    },
  );
});

test('server unavailable errors are normalized', async () => {
  const provider = new OpenAIProvider({
    clientFactory: {
      create: () => ({
        create: async () => {
          throw { name: 'APIError', status: 503, message: 'unavailable' };
        },
      }),
    },
    clock: CLOCK,
    getApiKey: () => 'test-api-key',
  });

  await assert.rejects(
    () =>
      provider.execute(
        baseRequest({ capabilityId: 'test.text', output: { mode: 'text' } }),
        { model: TEST_MODEL },
      ),
    (error: unknown) => {
      assert.ok(error instanceof ProviderError);
      assert.equal(error.code, 'PROVIDER_UNAVAILABLE_ERROR');
      return true;
    },
  );
});

test('malformed structured JSON is a typed provider error', async () => {
  const { service } = createServiceWithFakeOpenAI(async () =>
    completedOpenAIResponse({ output_text: '{not-json' }),
  );

  await assert.rejects(
    () =>
      service.execute(
        baseRequest({
          capabilityId: 'test.structured',
          output: { mode: 'structured', schema: SUMMARY_SCHEMA },
        }),
      ),
    (error: unknown) => {
      assert.ok(error instanceof ProviderError);
      assert.equal(error.code, 'PROVIDER_INVALID_STRUCTURED_OUTPUT');
      return true;
    },
  );
});

test('schema validation failure is a typed provider error', async () => {
  const { service } = createServiceWithFakeOpenAI(async () =>
    completedOpenAIResponse({
      output_text: JSON.stringify({ headline: 'Only one field' }),
    }),
  );

  await assert.rejects(
    () =>
      service.execute(
        baseRequest({
          capabilityId: 'test.structured',
          output: { mode: 'structured', schema: SUMMARY_SCHEMA },
        }),
      ),
    (error: unknown) => {
      assert.ok(error instanceof ProviderError);
      assert.equal(error.code, 'PROVIDER_INVALID_STRUCTURED_OUTPUT');
      return true;
    },
  );
});

test('refusal responses do not masquerade as valid structured output', async () => {
  const { service } = createServiceWithFakeOpenAI(async () =>
    completedOpenAIResponse({
      status: 'completed',
      output: [
        {
          type: 'message',
          content: [{ type: 'refusal', refusal: 'I cannot help with that.' }],
        },
      ],
    }),
  );

  const response = await service.execute(
    baseRequest({
      capabilityId: 'test.structured',
      output: { mode: 'structured', schema: SUMMARY_SCHEMA },
    }),
  );

  assert.equal(response.finishStatus, 'refused');
  assert.equal(response.validation.valid, false);
});

test('incomplete responses are normalized without valid structured output', async () => {
  const { service } = createServiceWithFakeOpenAI(async () =>
    completedOpenAIResponse({
      status: 'incomplete',
      output_text: '{"headline":"Partial","priority":"',
      incomplete_details: { reason: 'max_output_tokens' },
    }),
  );

  const response = await service.execute(
    baseRequest({
      capabilityId: 'test.structured',
      output: { mode: 'structured', schema: SUMMARY_SCHEMA },
    }),
  );

  assert.equal(response.finishStatus, 'incomplete');
  assert.equal(response.validation.valid, false);
});

test('OpenAI adapter passes store false on every request', async () => {
  const { service, captured } = createServiceWithFakeOpenAI(async () => completedOpenAIResponse());

  await service.execute(
    baseRequest({ capabilityId: 'test.text', output: { mode: 'text' } }),
  );

  assert.equal(captured[0]?.store, false);
});

test('JSON Schema is translated for OpenAI Structured Outputs', () => {
  const params = buildOpenAIResponsesCreateParams(
    baseRequest({
      capabilityId: 'test.structured',
      output: { mode: 'structured', schema: SUMMARY_SCHEMA, schemaName: 'brief_summary' },
    }),
    TEST_MODEL,
  );

  assert.deepEqual(params.text, {
    format: {
      type: 'json_schema',
      name: 'brief_summary',
      strict: true,
      schema: {
        type: 'object',
        properties: {
          headline: { type: 'string' },
          priority: { type: 'string' },
        },
        required: ['headline', 'priority'],
        additionalProperties: false,
      },
    },
  });
});

test('reasoningEffort maps to OpenAI reasoning.effort without exposing SDK types', () => {
  const params = buildOpenAIResponsesCreateParams(
    baseRequest({
      capabilityId: 'test.text',
      output: { mode: 'text' },
      generationOptions: {
        reasoningEffort: 'low',
        maxOutputTokens: 3000,
      },
    }),
    TEST_MODEL,
  );

  assert.deepEqual(params.reasoning, { effort: 'low' });
  assert.equal(params.max_output_tokens, 3000);
  assert.equal(params.store, false);
});

test('reasoning tokens are normalized when OpenAI exposes output_tokens_details', async () => {
  const { service } = createServiceWithFakeOpenAI(async () =>
    completedOpenAIResponse({
      usage: {
        input_tokens: 100,
        output_tokens: 500,
        total_tokens: 600,
        output_tokens_details: {
          reasoning_tokens: 320,
        },
      },
    }),
  );

  const response = await service.execute(
    baseRequest({ capabilityId: 'test.text', output: { mode: 'text' } }),
  );

  assert.equal(response.usage.reasoningTokens, 320);
  assert.equal(response.usage.outputTokens, 500);
});

test('absent reasoning token details remain undefined in normalized usage', async () => {
  const { service } = createServiceWithFakeOpenAI(async () =>
    completedOpenAIResponse({
      usage: {
        input_tokens: 100,
        output_tokens: 500,
        total_tokens: 600,
      },
    }),
  );

  const response = await service.execute(
    baseRequest({ capabilityId: 'test.text', output: { mode: 'text' } }),
  );

  assert.equal(response.usage.reasoningTokens, undefined);
});

test('public package exports do not expose OpenAI SDK types', async () => {
  const moduleExports = await import('../index');
  const exportNames = Object.keys(moduleExports);
  assert.ok(!exportNames.some((name) => name.toLowerCase().includes('openai') && name.includes('Client')));
  assert.equal(typeof moduleExports.OpenAIProvider, 'function');
  assert.equal(typeof moduleExports.buildOpenAIResponsesCreateParams, 'function');
});
