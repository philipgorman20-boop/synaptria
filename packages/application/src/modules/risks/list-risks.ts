import type { OrganizationId } from '@synaptria/core';
import type { OrganizationRole } from '@synaptria/core/context';
import type { Risk, RiskRepository } from '@synaptria/domain/risks';
import { PERMISSIONS, requirePermission } from '@synaptria/permissions';

export interface ListRisksContext {
  readonly organizationId: OrganizationId;
  readonly role: OrganizationRole;
}

export interface ListRisksOutput {
  readonly risks: readonly Risk[];
}

export class ListRisksUseCase {
  constructor(private readonly risks: RiskRepository) {}

  async execute(context: ListRisksContext): Promise<ListRisksOutput> {
    requirePermission(context.role, PERMISSIONS.PROGRAMS_READ);

    const risks = await this.risks.listForOrganization(context.organizationId);

    return { risks: risks.filter((r) => r.deletedAt === undefined) };
  }
}
