export type ApplicationErrorCode =
  | 'AUTHENTICATION_REQUIRED'
  | 'AUTHORIZATION_DENIED'
  | 'CONFLICT'
  | 'NOT_FOUND'
  | 'TENANT_CONTEXT_REQUIRED'
  | 'VALIDATION_FAILED';

export interface ApplicationErrorOptions {
  code: ApplicationErrorCode;
  message: string;
  cause?: unknown;
  details?: Readonly<Record<string, unknown>>;
}

/** A typed, expected failure raised by an application use case. */
export class ApplicationError extends Error {
  readonly code: ApplicationErrorCode;
  readonly details: Readonly<Record<string, unknown>> | undefined;

  constructor(options: ApplicationErrorOptions) {
    super(options.message, { cause: options.cause });
    this.name = 'ApplicationError';
    this.code = options.code;
    this.details = options.details;
  }
}
