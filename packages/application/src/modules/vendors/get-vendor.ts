import type { OrganizationId, VendorId } from '@synaptria/core';
import type { OrganizationRole } from '@synaptria/core/context';
import type { Vendor, VendorRepository } from '@synaptria/domain/vendors';
import { PERMISSIONS, requirePermission } from '@synaptria/permissions';

import { ApplicationError } from '../../shared/application-error';

export interface GetVendorContext {
  readonly organizationId: OrganizationId;
  readonly role: OrganizationRole;
}

export interface GetVendorInput {
  readonly vendorId: VendorId;
}

export interface GetVendorOutput {
  readonly vendor: Vendor;
}

export class GetVendorUseCase {
  constructor(private readonly vendors: VendorRepository) {}

  async execute(context: GetVendorContext, input: GetVendorInput): Promise<GetVendorOutput> {
    requirePermission(context.role, PERMISSIONS.VENDORS_READ);

    const vendor = await this.vendors.findById(context.organizationId, input.vendorId);

    if (vendor === null || vendor.deletedAt !== undefined) {
      throw new ApplicationError({
        code: 'NOT_FOUND',
        message: 'Vendor not found.',
        details: { vendorId: input.vendorId },
      });
    }

    return { vendor };
  }
}
