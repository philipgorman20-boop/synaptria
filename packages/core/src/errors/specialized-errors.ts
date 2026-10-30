import { CoreError } from './core-error';

export class AuthenticationRequiredError extends CoreError {
  constructor(message = 'Authentication is required.') {
    super({ code: 'AUTHENTICATION_REQUIRED', message });
    this.name = 'AuthenticationRequiredError';
  }
}

export class AuthorizationDeniedError extends CoreError {
  constructor(message = 'You do not have permission to perform this action.') {
    super({ code: 'AUTHORIZATION_DENIED', message });
    this.name = 'AuthorizationDeniedError';
  }
}

export class TenantContextRequiredError extends CoreError {
  constructor(message = 'An active organization context is required.') {
    super({ code: 'TENANT_CONTEXT_REQUIRED', message });
    this.name = 'TenantContextRequiredError';
  }
}

export class NotFoundError extends CoreError {
  constructor(resource: string, details?: Readonly<Record<string, unknown>>) {
    super(
      details === undefined
        ? { code: 'NOT_FOUND', message: `${resource} was not found.` }
        : { code: 'NOT_FOUND', message: `${resource} was not found.`, details },
    );
    this.name = 'NotFoundError';
  }
}
