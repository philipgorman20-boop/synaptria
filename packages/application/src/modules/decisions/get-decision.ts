import type { DecisionId, OrganizationId } from '@synaptria/core';
import type { OrganizationRole } from '@synaptria/core/context';
import type { Decision, DecisionRepository } from '@synaptria/domain/decisions';
import { PERMISSIONS, requirePermission } from '@synaptria/permissions';

import { ApplicationError } from '../../shared/application-error';

export interface GetDecisionContext {
  readonly organizationId: OrganizationId;
  readonly role: OrganizationRole;
}

export interface GetDecisionInput {
  readonly decisionId: DecisionId;
}

export interface GetDecisionOutput {
  readonly decision: Decision;
}

export class GetDecisionUseCase {
  constructor(private readonly decisions: DecisionRepository) {}

  async execute(context: GetDecisionContext, input: GetDecisionInput): Promise<GetDecisionOutput> {
    requirePermission(context.role, PERMISSIONS.PROGRAMS_READ);

    const decision = await this.decisions.findById(context.organizationId, input.decisionId);

    if (decision === null || decision.deletedAt !== undefined) {
      throw new ApplicationError({
        code: 'NOT_FOUND',
        message: 'Decision not found.',
        details: { decisionId: input.decisionId },
      });
    }

    return { decision };
  }
}
