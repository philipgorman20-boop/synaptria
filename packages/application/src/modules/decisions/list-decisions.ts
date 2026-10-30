import type { OrganizationId } from '@synaptria/core';
import type { OrganizationRole } from '@synaptria/core/context';
import type { Decision, DecisionRepository } from '@synaptria/domain/decisions';
import { PERMISSIONS, requirePermission } from '@synaptria/permissions';

export interface ListDecisionsContext {
  readonly organizationId: OrganizationId;
  readonly role: OrganizationRole;
}

export interface ListDecisionsOutput {
  readonly decisions: readonly Decision[];
}

export class ListDecisionsUseCase {
  constructor(private readonly decisions: DecisionRepository) {}

  async execute(context: ListDecisionsContext): Promise<ListDecisionsOutput> {
    requirePermission(context.role, PERMISSIONS.PROGRAMS_READ);

    const decisions = await this.decisions.listForOrganization(context.organizationId);

    return { decisions: decisions.filter((d) => d.deletedAt === undefined) };
  }
}
