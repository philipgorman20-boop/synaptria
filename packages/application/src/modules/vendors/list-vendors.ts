import type { OrganizationId } from '@synaptria/core';
import type { OrganizationRole } from '@synaptria/core/context';
import type { Vendor, VendorRepository } from '@synaptria/domain/vendors';
import { PERMISSIONS, requirePermission } from '@synaptria/permissions';

export interface ListVendorsContext {
  readonly organizationId: OrganizationId;
  readonly role: OrganizationRole;
}

export interface ListVendorsOutput {
  readonly vendors: readonly Vendor[];
}

export class ListVendorsUseCase {
  constructor(private readonly vendors: VendorRepository) {}

  async execute(context: ListVendorsContext): Promise<ListVendorsOutput> {
    requirePermission(context.role, PERMISSIONS.VENDORS_READ);

    const vendors = await this.vendors.listForOrganization(context.organizationId);

    return { vendors: vendors.filter((v) => v.deletedAt === undefined) };
  }
}
