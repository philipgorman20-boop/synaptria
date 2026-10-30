import type { OrganizationId, RiskId } from '@synaptria/core';
import type { OrganizationRole } from '@synaptria/core/context';
import type { Risk, RiskRepository } from '@synaptria/domain/risks';
import { PERMISSIONS, requirePermission } from '@synaptria/permissions';

import { ApplicationError } from '../../shared/application-error';

export interface GetRiskContext {
  readonly organizationId: OrganizationId;
  readonly role: OrganizationRole;
}

export interface GetRiskInput {
  readonly riskId: RiskId;
}

export interface GetRiskOutput {
  readonly risk: Risk;
}

export class GetRiskUseCase {
  constructor(private readonly risks: RiskRepository) {}

  async execute(context: GetRiskContext, input: GetRiskInput): Promise<GetRiskOutput> {
    requirePermission(context.role, PERMISSIONS.PROGRAMS_READ);

    const risk = await this.risks.findById(context.organizationId, input.riskId);

    if (risk === null || risk.deletedAt !== undefined) {
      throw new ApplicationError({
        code: 'NOT_FOUND',
        message: 'Risk not found.',
        details: { riskId: input.riskId },
      });
    }

    return { risk };
  }
}
