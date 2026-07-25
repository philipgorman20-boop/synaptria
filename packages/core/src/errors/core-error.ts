export type CoreErrorCode =
  | 'AUTHENTICATION_REQUIRED'
  | 'AUTHORIZATION_DENIED'
  | 'CONFLICT'
  | 'INVALID_CONTEXT'
  | 'NOT_FOUND'
  | 'TENANT_CONTEXT_REQUIRED'
  | 'VALIDATION_FAILED';

export interface CoreErrorOptions {
  code: CoreErrorCode;
  message: string;
  cause?: unknown;
  details?: Readonly<Record<string, unknown>>;
}

export class CoreError extends Error {
  readonly code: CoreErrorCode;
  readonly details: Readonly<Record<string, unknown>> | undefined;

  constructor(options: CoreErrorOptions) {
    super(options.message, options.cause === undefined ? undefined : { cause: options.cause });
    this.name = 'CoreError';
    this.code = options.code;
    this.details = options.details;
  }
}
