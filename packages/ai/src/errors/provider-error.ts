export type ProviderErrorCode =
  | 'PROVIDER_CONFIGURATION_ERROR'
  | 'PROVIDER_AUTHENTICATION_ERROR'
  | 'PROVIDER_RATE_LIMIT_ERROR'
  | 'PROVIDER_TIMEOUT_ERROR'
  | 'PROVIDER_UNAVAILABLE_ERROR'
  | 'PROVIDER_INVALID_STRUCTURED_OUTPUT'
  | 'PROVIDER_UNSUPPORTED_CAPABILITY'
  | 'PROVIDER_NOT_FOUND'
  | 'PROVIDER_UNKNOWN_ERROR';

export interface ProviderErrorOptions {
  readonly code: ProviderErrorCode;
  readonly message: string;
  readonly providerId?: string;
  readonly cause?: unknown;
  readonly details?: Readonly<Record<string, unknown>>;
}

export class ProviderError extends Error {
  readonly code: ProviderErrorCode;
  readonly providerId: string | undefined;
  readonly details: Readonly<Record<string, unknown>> | undefined;

  constructor(options: ProviderErrorOptions) {
    super(options.message, options.cause === undefined ? undefined : { cause: options.cause });
    this.name = 'ProviderError';
    this.code = options.code;
    this.providerId = options.providerId;
    this.details = options.details;
  }
}

export function providerConfigurationError(
  message: string,
  options: Omit<ProviderErrorOptions, 'code' | 'message'> = {},
): ProviderError {
  return new ProviderError({ code: 'PROVIDER_CONFIGURATION_ERROR', message, ...options });
}

export function providerAuthenticationError(
  message: string,
  options: Omit<ProviderErrorOptions, 'code' | 'message'> = {},
): ProviderError {
  return new ProviderError({ code: 'PROVIDER_AUTHENTICATION_ERROR', message, ...options });
}

export function providerRateLimitError(
  message: string,
  options: Omit<ProviderErrorOptions, 'code' | 'message'> = {},
): ProviderError {
  return new ProviderError({ code: 'PROVIDER_RATE_LIMIT_ERROR', message, ...options });
}

export function providerTimeoutError(
  message: string,
  options: Omit<ProviderErrorOptions, 'code' | 'message'> = {},
): ProviderError {
  return new ProviderError({ code: 'PROVIDER_TIMEOUT_ERROR', message, ...options });
}

export function providerUnavailableError(
  message: string,
  options: Omit<ProviderErrorOptions, 'code' | 'message'> = {},
): ProviderError {
  return new ProviderError({ code: 'PROVIDER_UNAVAILABLE_ERROR', message, ...options });
}

export function providerInvalidStructuredOutputError(
  message: string,
  options: Omit<ProviderErrorOptions, 'code' | 'message'> = {},
): ProviderError {
  return new ProviderError({
    code: 'PROVIDER_INVALID_STRUCTURED_OUTPUT',
    message,
    ...options,
  });
}

export function providerUnsupportedCapabilityError(
  message: string,
  options: Omit<ProviderErrorOptions, 'code' | 'message'> = {},
): ProviderError {
  return new ProviderError({
    code: 'PROVIDER_UNSUPPORTED_CAPABILITY',
    message,
    ...options,
  });
}

export function providerNotFoundError(
  message: string,
  options: Omit<ProviderErrorOptions, 'code' | 'message'> = {},
): ProviderError {
  return new ProviderError({ code: 'PROVIDER_NOT_FOUND', message, ...options });
}

export function providerUnknownError(
  message: string,
  options: Omit<ProviderErrorOptions, 'code' | 'message'> = {},
): ProviderError {
  return new ProviderError({ code: 'PROVIDER_UNKNOWN_ERROR', message, ...options });
}
