import type { OrganizationId } from '@synaptria/core';
import type { OrganizationRole } from '@synaptria/core/context';
import type { FundingEvent, FundingEventRepository } from '@synaptria/domain/budgets';
import { PERMISSIONS, requirePermission } from '@synaptria/permissions';

export interface ListFundingEventsContext {
  readonly organizationId: OrganizationId;
  readonly role: OrganizationRole;
}

export interface ListFundingEventsOutput {
  readonly fundingEvents: readonly FundingEvent[];
}

export class ListFundingEventsUseCase {
  constructor(private readonly fundingEventRepository: FundingEventRepository) {}

  async execute(context: ListFundingEventsContext): Promise<ListFundingEventsOutput> {
    requirePermission(context.role, PERMISSIONS.FINANCE_MANAGE);

    const fundingEvents = await this.fundingEventRepository.listForOrganization(context.organizationId);
    return { fundingEvents };
  }
}
