import type {
  OrganizationId,
  UserId,
  VendorId,
} from '@synaptria/core';

export type VendorStatus =
  | 'PROSPECTIVE'
  | 'QUALIFYING'
  | 'APPROVED'
  | 'ACTIVE'
  | 'SUSPENDED'
  | 'INACTIVE'
  | 'ARCHIVED';

export type VendorCategory =
  | 'CRO'
  | 'CDMO'
  | 'CONSULTANT'
  | 'LEGAL'
  | 'REGULATORY'
  | 'CLINICAL'
  | 'SOFTWARE'
  | 'EQUIPMENT'
  | 'LAB_SUPPLIES'
  | 'FACILITIES'
  | 'FINANCE'
  | 'HR'
  | 'OTHER';

export interface Vendor {
  readonly id: VendorId;
  readonly organizationId: OrganizationId;
  readonly ownerId?: UserId;
  readonly name: string;
  readonly legalName?: string;
  readonly category: VendorCategory;
  readonly status: VendorStatus;
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
  readonly deletedAt?: Date;
  readonly createdAt: Date;
  readonly updatedAt: Date;
}
