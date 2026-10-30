import assert from 'node:assert/strict';
import test from 'node:test';

import {
  APIConnectionError,
  APIConnectionTimeoutError,
  APIError,
  AuthenticationError,
  BadRequestError,
  InternalServerError,
  NotFoundError,
  PermissionDeniedError,
  RateLimitError,
} from 'openai';

import { ProviderError } from '../../errors/provider-error';
import { normalizeOpenAIProviderError } from './normalize-openai-error';

function openAIErrorHeaders(requestId = 'req_test_123'): Headers {
  return new Headers({ 'x-request-id': requestId });
}

function badRequestError(): BadRequestError {
  return APIError.generate(
    400,
    {
      error: {
        message: 'Invalid schema for response_format',
        type: 'invalid_request_error',
        param: 'text.format.schema',
        code: 'invalid_json_schema',
      },
    },
    undefined,
    openAIErrorHeaders(),
  ) as BadRequestError;
}

test('BadRequestError is normalized as invalid structured output, not unknown', () => {
  const sdkError = badRequestError();
  const normalized = normalizeOpenAIProviderError(sdkError);

  assert.ok(normalized instanceof ProviderError);
  assert.equal(normalized.code, 'PROVIDER_INVALID_STRUCTURED_OUTPUT');
  assert.equal(normalized.cause, sdkError);
});

test('AuthenticationError preserves SDK cause and maps to authentication code', () => {
  const sdkError = APIError.generate(
    401,
    { error: { message: 'Incorrect API key provided' } },
    undefined,
    openAIErrorHeaders(),
  ) as AuthenticationError;

  const normalized = normalizeOpenAIProviderError(sdkError);

  assert.equal(normalized.code, 'PROVIDER_AUTHENTICATION_ERROR');
  assert.equal(normalized.cause, sdkError);
});

test('PermissionDeniedError maps to authentication permission failure', () => {
  const sdkError = APIError.generate(
    403,
    { error: { message: 'Project access denied' } },
    undefined,
    openAIErrorHeaders(),
  ) as PermissionDeniedError;

  const normalized = normalizeOpenAIProviderError(sdkError);

  assert.equal(normalized.code, 'PROVIDER_AUTHENTICATION_ERROR');
  assert.match(normalized.message, /permissions/i);
  assert.equal(normalized.cause, sdkError);
});

test('RateLimitError maps to provider rate limit code', () => {
  const sdkError = APIError.generate(
    429,
    { error: { message: 'Rate limit reached' } },
    undefined,
    openAIErrorHeaders(),
  ) as RateLimitError;

  const normalized = normalizeOpenAIProviderError(sdkError);

  assert.equal(normalized.code, 'PROVIDER_RATE_LIMIT_ERROR');
  assert.equal(normalized.cause, sdkError);
});

test('NotFoundError maps to provider not found code', () => {
  const sdkError = APIError.generate(
    404,
    { error: { message: 'The model `missing-model` does not exist' } },
    undefined,
    openAIErrorHeaders(),
  ) as NotFoundError;

  const normalized = normalizeOpenAIProviderError(sdkError);

  assert.equal(normalized.code, 'PROVIDER_NOT_FOUND');
  assert.equal(normalized.cause, sdkError);
});

test('InternalServerError maps to provider unavailable code', () => {
  const sdkError = APIError.generate(
    503,
    { error: { message: 'The server is overloaded' } },
    undefined,
    openAIErrorHeaders(),
  ) as InternalServerError;

  const normalized = normalizeOpenAIProviderError(sdkError);

  assert.equal(normalized.code, 'PROVIDER_UNAVAILABLE_ERROR');
  assert.equal(normalized.details?.status, 503);
  assert.equal(normalized.cause, sdkError);
});

test('APIConnectionError maps to timeout code and preserves nested cause', () => {
  const nestedCause = new Error('fetch failed');
  const sdkError = new APIConnectionError({ message: 'Connection error.', cause: nestedCause });

  const normalized = normalizeOpenAIProviderError(sdkError);

  assert.equal(normalized.code, 'PROVIDER_TIMEOUT_ERROR');
  assert.equal(normalized.cause, sdkError);
  assert.equal((normalized.cause as APIConnectionError).cause, nestedCause);
});

test('APIConnectionTimeoutError maps to timeout code', () => {
  const sdkError = new APIConnectionTimeoutError();

  const normalized = normalizeOpenAIProviderError(sdkError);

  assert.equal(normalized.code, 'PROVIDER_TIMEOUT_ERROR');
  assert.equal(normalized.cause, sdkError);
});

test('legacy plain-object OpenAI errors remain supported for tests', () => {
  const normalized = normalizeOpenAIProviderError({
    name: 'APIError',
    status: 400,
    message: 'invalid request',
  });

  assert.equal(normalized.code, 'PROVIDER_INVALID_STRUCTURED_OUTPUT');
});
