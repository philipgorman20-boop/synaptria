import type { OrganizationId } from '@synaptria/core';
import type { OrganizationRole } from '@synaptria/core/context';
import type {
  ActionProposal,
  ActionProposalPreconditionValidation,
} from '@synaptria/domain/action-proposals';

export interface OperationalActionProposalReadResult {
  readonly proposal: ActionProposal;
  readonly validation: ActionProposalPreconditionValidation;
}

export interface OperationalActionProposalReader {
  loadOperationalProposal(
    context: {
      readonly organizationId: OrganizationId;
      readonly role: OrganizationRole;
    },
    recommendationId: string,
  ): Promise<OperationalActionProposalReadResult | null>;
}
