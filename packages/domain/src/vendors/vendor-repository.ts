import type {
  OrganizationId,
  UserId,
  VendorId,
} from '@synaptria/core';

import type { Vendor, VendorCategory, VendorStatus } from './models';

export interface CreateVendorInput {
  readonly organizationId: OrganizationId;
  readonly ownerId?: UserId;
  readonly name: string;
  readonly legalName?: string;
  readonly category: VendorCategory;
  readonly status?: VendorStatus;
  readonly website?: string;
  readonly email?: string;
  readonly phone?: string;
  readonly addressLine1?: string;
  readonly addressLine2?: string;
  readonly city?: string;
  readonly stateProvince?: string;
  readonly postalCode?: string;
  readonly country?: string;
  readonly taxId?: string;
  readonly paymentTermsDays?: number;
  readonly notes?: string;
}

export interface UpdateVendorInput {
  readonly name?: string;
  readonly legalName?: string | null;
  readonly category?: VendorCategory;
  readonly status?: VendorStatus;
  readonly website?: string | null;
  readonly email?: string | null;
  readonly phone?: string | null;
  readonly addressLine1?: string | null;
  readonly addressLine2?: string | null;
  readonly city?: string | null;
  readonly stateProvince?: string | null;
  readonly postalCode?: string | null;
  readonly country?: string | null;
  readonly taxId?: string | null;
  readonly paymentTermsDays?: number | null;
  readonly notes?: string | null;
  readonly ownerId?: UserId | null;
}

export interface VendorRepository {
  create(input: CreateVendorInput): Promise<Vendor>;
  findById(organizationId: OrganizationId, id: VendorId): Promise<Vendor | null>;
  findByName(organizationId: OrganizationId, name: string): Promise<Vendor | null>;
  update(organizationId: OrganizationId, id: VendorId, input: UpdateVendorInput): Promise<Vendor>;
  softDelete(organizationId: OrganizationId, id: VendorId, deletedAt: Date): Promise<Vendor>;
  listForOrganization(organizationId: OrganizationId): Promise<readonly Vendor[]>;
}
