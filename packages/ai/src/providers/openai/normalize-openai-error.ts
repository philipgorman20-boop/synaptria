import {
  providerAuthenticationError,
  providerInvalidStructuredOutputError,
  providerRateLimitError,
  providerTimeoutError,
  providerUnavailableError,
  providerUnknownError,
  ProviderError,
} from '../../errors/provider-error';

function isRecord(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === 'object';
}

function readStatus(error: Record<string, unknown>): number | undefined {
  const status = error.status;
  return typeof status === 'number' ? status : undefined;
}

function readName(error: Record<string, unknown>): string | undefined {
  const name = error.name;
  return typeof name === 'string' ? name : undefined;
}

export function normalizeOpenAIProviderError(error: unknown): ProviderError {
  if (error instanceof ProviderError) {
    return error;
  }

  if (!isRecord(error)) {
    return providerUnknownError('OpenAI provider request failed.', { providerId: 'openai', cause: error });
  }

  const name = readName(error);
  const status = readStatus(error);

  if (name === 'APIConnectionTimeoutError' || name === 'TimeoutError') {
    return providerTimeoutError('OpenAI provider request timed out.', {
      providerId: 'openai',
      cause: error,
    });
  }

  if (name === 'APIConnectionError') {
    return providerTimeoutError('OpenAI provider network connection failed.', {
      providerId: 'openai',
      cause: error,
    });
  }

  if (status === 401 || status === 403) {
    return providerAuthenticationError('OpenAI provider rejected the API credentials.', {
      providerId: 'openai',
      cause: error,
    });
  }

  if (status === 429) {
    return providerRateLimitError('OpenAI provider rate limit exceeded.', {
      providerId: 'openai',
      cause: error,
    });
  }

  if (status === 408) {
    return providerTimeoutError('OpenAI provider request timed out.', {
      providerId: 'openai',
      cause: error,
    });
  }

  if (status !== undefined && status >= 500) {
    return providerUnavailableError('OpenAI provider is unavailable.', {
      providerId: 'openai',
      cause: error,
      details: { status },
    });
  }

  return providerUnknownError('OpenAI provider request failed.', {
    providerId: 'openai',
    cause: error,
    ...(status === undefined ? {} : { details: { status } }),
  });
}

export function invalidStructuredOutputFromIssues(
  issues: readonly string[],
  cause?: unknown,
): ProviderError {
  return providerInvalidStructuredOutputError(
    'OpenAI structured output failed schema validation.',
    {
      providerId: 'openai',
      ...(cause === undefined ? {} : { cause }),
      details: { issues },
    },
  );
}

export function invalidStructuredOutputFromMalformedJson(cause: unknown): ProviderError {
  return providerInvalidStructuredOutputError('OpenAI structured output was malformed JSON.', {
    providerId: 'openai',
    cause,
  });
}
