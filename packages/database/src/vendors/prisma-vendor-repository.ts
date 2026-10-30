import {
  Prisma,
  type Vendor as PrismaVendor,
  type PrismaClient,
} from '@prisma/client';
import {
  identifier,
  userId,
  vendorId,
  type OrganizationId,
  type VendorId,
} from '@synaptria/core';
import { NotFoundError } from '@synaptria/core/errors';
import type {
  CreateVendorInput,
  UpdateVendorInput,
  Vendor,
  VendorCategory,
  VendorRepository,
  VendorStatus,
} from '@synaptria/domain/vendors';

import { throwUniqueConstraintConflict } from '../prisma-errors';

export type VendorDatabaseClient = Pick<PrismaClient, 'vendor'>;

const VENDOR_SELECT = {
  id: true,
  organizationId: true,
  ownerId: true,
  name: true,
  legalName: true,
  category: true,
  status: true,
  website: true,
  email: true,
  phone: true,
  addressLine1: true,
  addressLine2: true,
  city: true,
  stateProvince: true,
  postalCode: true,
  country: true,
  taxId: true,
  paymentTermsDays: true,
  notes: true,
  deletedAt: true,
  createdAt: true,
  updatedAt: true,
} as const satisfies Prisma.VendorSelect;

type SelectedVendor = Prisma.VendorGetPayload<{ select: typeof VENDOR_SELECT }>;

const VENDOR_UNIQUE_CONFLICTS = {
  name: 'A vendor with this name already exists.',
} as const;

const activeVendorWhere = (organizationId: OrganizationId): Prisma.VendorWhereInput => ({
  organizationId,
  deletedAt: null,
});

export class PrismaVendorRepository implements VendorRepository {
  constructor(private readonly client: VendorDatabaseClient) {}

  async create(input: CreateVendorInput): Promise<Vendor> {
    const data: Prisma.VendorUncheckedCreateInput = {
      organizationId: input.organizationId,
      name: input.name,
      category: input.category,
      status: input.status ?? 'PROSPECTIVE',
      ...(input.ownerId === undefined ? {} : { ownerId: input.ownerId }),
      ...(input.legalName === undefined ? {} : { legalName: input.legalName }),
      ...(input.website === undefined ? {} : { website: input.website }),
      ...(input.email === undefined ? {} : { email: input.email }),
      ...(input.phone === undefined ? {} : { phone: input.phone }),
      ...(input.addressLine1 === undefined ? {} : { addressLine1: input.addressLine1 }),
      ...(input.addressLine2 === undefined ? {} : { addressLine2: input.addressLine2 }),
      ...(input.city === undefined ? {} : { city: input.city }),
      ...(input.stateProvince === undefined ? {} : { stateProvince: input.stateProvince }),
      ...(input.postalCode === undefined ? {} : { postalCode: input.postalCode }),
      ...(input.country === undefined ? {} : { country: input.country }),
      ...(input.taxId === undefined ? {} : { taxId: input.taxId }),
      ...(input.paymentTermsDays === undefined ? {} : { paymentTermsDays: input.paymentTermsDays }),
      ...(input.notes === undefined ? {} : { notes: input.notes }),
    };

    try {
      const row = await this.client.vendor.create({ data, select: VENDOR_SELECT });
      return mapVendor(row);
    } catch (error) {
      throwUniqueConstraintConflict(error, VENDOR_UNIQUE_CONFLICTS, 'name');
    }
  }

  async findById(organizationId: OrganizationId, id: VendorId): Promise<Vendor | null> {
    const row = await this.client.vendor.findFirst({
      where: { ...activeVendorWhere(organizationId), id },
      select: VENDOR_SELECT,
    });
    return row === null ? null : mapVendor(row);
  }

  async findByName(organizationId: OrganizationId, name: string): Promise<Vendor | null> {
    const row = await this.client.vendor.findFirst({
      where: { ...activeVendorWhere(organizationId), name },
      select: VENDOR_SELECT,
    });
    return row === null ? null : mapVendor(row);
  }

  async update(organizationId: OrganizationId, id: VendorId, input: UpdateVendorInput): Promise<Vendor> {
    const existing = await this.findById(organizationId, id);
    if (existing === null) throw new NotFoundError('Vendor', { vendorId: id, organizationId });

    const data: Prisma.VendorUpdateInput = {
      ...(input.name === undefined ? {} : { name: input.name }),
      ...(input.legalName === undefined ? {} : { legalName: input.legalName }),
      ...(input.category === undefined ? {} : { category: input.category }),
      ...(input.status === undefined ? {} : { status: input.status }),
      ...(input.website === undefined ? {} : { website: input.website }),
      ...(input.email === undefined ? {} : { email: input.email }),
      ...(input.phone === undefined ? {} : { phone: input.phone }),
      ...(input.addressLine1 === undefined ? {} : { addressLine1: input.addressLine1 }),
      ...(input.addressLine2 === undefined ? {} : { addressLine2: input.addressLine2 }),
      ...(input.city === undefined ? {} : { city: input.city }),
      ...(input.stateProvince === undefined ? {} : { stateProvince: input.stateProvince }),
      ...(input.postalCode === undefined ? {} : { postalCode: input.postalCode }),
      ...(input.country === undefined ? {} : { country: input.country }),
      ...(input.taxId === undefined ? {} : { taxId: input.taxId }),
      ...(input.paymentTermsDays === undefined ? {} : { paymentTermsDays: input.paymentTermsDays }),
      ...(input.notes === undefined ? {} : { notes: input.notes }),
      ...(input.ownerId === undefined ? {} : { ownerId: input.ownerId }),
    };

    try {
      const row = await this.client.vendor.update({ where: { id }, data, select: VENDOR_SELECT });
      return mapVendor(row);
    } catch (error) {
      throwUniqueConstraintConflict(error, VENDOR_UNIQUE_CONFLICTS, 'name');
    }
  }

  async softDelete(organizationId: OrganizationId, id: VendorId, deletedAt: Date): Promise<Vendor> {
    const existing = await this.findById(organizationId, id);
    if (existing === null) throw new NotFoundError('Vendor', { vendorId: id, organizationId });

    const row = await this.client.vendor.update({ where: { id }, data: { deletedAt }, select: VENDOR_SELECT });
    return mapVendor(row);
  }

  async listForOrganization(organizationId: OrganizationId): Promise<readonly Vendor[]> {
    const rows = await this.client.vendor.findMany({
      where: activeVendorWhere(organizationId),
      select: VENDOR_SELECT,
      orderBy: [{ name: 'asc' }],
    });
    return rows.map(mapVendor);
  }
}

export function mapVendor(row: SelectedVendor | PrismaVendor): Vendor {
  return {
    id: vendorId(row.id),
    organizationId: identifier(row.organizationId, 'OrganizationId') as OrganizationId,
    ...(row.ownerId === null ? {} : { ownerId: userId(row.ownerId) }),
    name: row.name,
    ...(row.legalName === null ? {} : { legalName: row.legalName }),
    category: row.category as VendorCategory,
    status: row.status as VendorStatus,
    ...(row.website === null ? {} : { website: row.website }),
    ...(row.email === null ? {} : { email: row.email }),
    ...(row.phone === null ? {} : { phone: row.phone }),
    ...(row.addressLine1 === null ? {} : { addressLine1: row.addressLine1 }),
    ...(row.addressLine2 === null ? {} : { addressLine2: row.addressLine2 }),
    ...(row.city === null ? {} : { city: row.city }),
    ...(row.stateProvince === null ? {} : { stateProvince: row.stateProvince }),
    ...(row.postalCode === null ? {} : { postalCode: row.postalCode }),
    ...(row.country === null ? {} : { country: row.country }),
    ...(row.taxId === null ? {} : { taxId: row.taxId }),
    ...(row.paymentTermsDays === null ? {} : { paymentTermsDays: row.paymentTermsDays }),
    ...(row.notes === null ? {} : { notes: row.notes }),
    ...(row.deletedAt === null ? {} : { deletedAt: row.deletedAt }),
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
}
