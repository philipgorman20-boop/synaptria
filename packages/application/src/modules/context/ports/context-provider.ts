import type {
  ContextAuthorization,
  ContextContribution,
  ContextContributorId,
  ContextIdentity,
  ContextRequest,
  ContextScope,
  ContextSectionId,
} from '@synaptria/domain/context';

import type { ContextCapabilityDefinition } from '../capabilities/types';

export interface ContextProviderInput {
  readonly request: ContextRequest;
  readonly scope: ContextScope;
  readonly identity: ContextIdentity;
  readonly authorization: ContextAuthorization;
  readonly capability: ContextCapabilityDefinition;
}

export interface ContextProvider {
  readonly contributorId: ContextContributorId;
  readonly sections: readonly ContextSectionId[];
  contribute(input: ContextProviderInput): Promise<readonly ContextContribution[]>;
}
