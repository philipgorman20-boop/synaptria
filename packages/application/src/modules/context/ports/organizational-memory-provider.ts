import type { ContextContribution } from '@synaptria/domain/context';

import type { ContextProvider, ContextProviderInput } from './context-provider';

export interface OrganizationalMemoryQuery extends ContextProviderInput {
  readonly operationalContext: readonly ContextContribution[];
}

/** Available retrieval with zero or more memory contributions. */
export interface OrganizationalMemoryAvailableResult {
  readonly status: 'available';
  readonly contributions: readonly ContextContribution[];
}

/** Organizational Memory capability is not implemented or otherwise unavailable. */
export interface OrganizationalMemoryUnavailableResult {
  readonly status: 'unavailable';
}

export type OrganizationalMemoryRetrievalResult =
  | OrganizationalMemoryAvailableResult
  | OrganizationalMemoryUnavailableResult;

export interface OrganizationalMemoryProvider extends ContextProvider {
  retrieve(input: OrganizationalMemoryQuery): Promise<OrganizationalMemoryRetrievalResult>;
}
