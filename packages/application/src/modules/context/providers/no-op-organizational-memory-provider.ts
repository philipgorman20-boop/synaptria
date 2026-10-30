import type { Clock } from '@synaptria/core';
import type { ContextContribution } from '@synaptria/domain/context';

import { CONTEXT_CONTRIBUTOR_IDS } from '../contributor-ids';
import type { ContextProvider } from '../ports/context-provider';
import type {
  OrganizationalMemoryProvider,
  OrganizationalMemoryRetrievalResult,
} from '../ports/organizational-memory-provider';

/** Phase 2 no-op Organizational Memory adapter — durable retrieval is unavailable. */
export class NoOpOrganizationalMemoryProvider implements OrganizationalMemoryProvider {
  readonly contributorId = CONTEXT_CONTRIBUTOR_IDS.organizationalMemory;
  readonly sections = ['organizationalMemory'] as const;

  constructor(_clock: Clock) {}

  async contribute(): Promise<readonly ContextContribution[]> {
    return [];
  }

  async retrieve(
    _input: Parameters<OrganizationalMemoryProvider['retrieve']>[0],
  ): Promise<OrganizationalMemoryRetrievalResult> {
    return { status: 'unavailable' };
  }
}
