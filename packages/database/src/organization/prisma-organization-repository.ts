import {
  Prisma,
  type Organization as PrismaOrganization,
  type PrismaClient,
} from "@prisma/client";
import { identifier, type OrganizationId, type UserId } from '@synaptria/core';
import type {
  CreateOrganizationInput,
  Organization,
  OrganizationRepository,
  OrganizationSettings,
  OrganizationSummary,
  UpdateOrganizationInput,
} from '@synaptria/domain/organization';

import { toPrismaJson } from '../json';
import { mapMembership } from './prisma-membership-repository';

export type OrganizationDatabaseClient = Pick<PrismaClient, 'organization' | 'membership'>;

export class PrismaOrganizationRepository implements OrganizationRepository {
  constructor(private readonly client: OrganizationDatabaseClient) {}

  async create(input: CreateOrganizationInput): Promise<Organization> {
    const data: Prisma.OrganizationCreateInput = {
      name: input.name,
      slug: input.slug,
      ...(input.legalName === undefined ? {} : { legalName: input.legalName }),
      ...(input.defaultCurrency === undefined
        ? {}
        : { defaultCurrency: input.defaultCurrency }),
      ...(input.fiscalYearStartMonth === undefined
        ? {}
        : { fiscalYearStartMonth: input.fiscalYearStartMonth }),
      ...(input.timezone === undefined ? {} : { timezone: input.timezone }),
      ...(input.countryCode === undefined ? {} : { countryCode: input.countryCode }),
      ...(input.settings === undefined ? {} : { settings: toPrismaJson(input.settings) }),
    };

    return mapOrganization(await this.client.organization.create({ data }));
  }

  async findById(id: OrganizationId): Promise<Organization | null> {
    const row = await this.client.organization.findFirst({
      where: { id, deletedAt: null },
    });
    return row === null ? null : mapOrganization(row);
  }

  async findBySlug(slug: string): Promise<Organization | null> {
    const row = await this.client.organization.findFirst({
      where: { slug, deletedAt: null },
    });
    return row === null ? null : mapOrganization(row);
  }

  async update(id: OrganizationId, input: UpdateOrganizationInput): Promise<Organization> {
    const data: Prisma.OrganizationUpdateInput = {
      ...(input.name === undefined ? {} : { name: input.name }),
      ...(input.slug === undefined ? {} : { slug: input.slug }),
      ...(input.legalName === undefined ? {} : { legalName: input.legalName }),
      ...(input.defaultCurrency === undefined
        ? {}
        : { defaultCurrency: input.defaultCurrency }),
      ...(input.fiscalYearStartMonth === undefined
        ? {}
        : { fiscalYearStartMonth: input.fiscalYearStartMonth }),
      ...(input.timezone === undefined ? {} : { timezone: input.timezone }),
      ...(input.countryCode === undefined ? {} : { countryCode: input.countryCode }),
      ...(input.settings === undefined
        ? {}
        : { settings: input.settings === null ? Prisma.JsonNull : toPrismaJson(input.settings) }),
    };

    return mapOrganization(
      await this.client.organization.update({ where: { id }, data }),
    );
  }

  async softDelete(id: OrganizationId, deletedAt: Date): Promise<Organization> {
    return mapOrganization(
      await this.client.organization.update({
        where: { id },
        data: { deletedAt },
      }),
    );
  }

  async listForUser(userId: UserId): Promise<readonly OrganizationSummary[]> {
    const rows = await this.client.membership.findMany({
      where: {
        userId,
        status: 'ACTIVE',
        organization: { deletedAt: null },
      },
      include: { organization: true },
      orderBy: { createdAt: 'asc' },
    });

    return rows.map((row) => ({
      organization: mapOrganization(row.organization),
      membership: mapMembership(row),
    }));
  }
}

export function mapOrganization(row: PrismaOrganization): Organization {
  const settings = isRecord(row.settings)
    ? (row.settings as OrganizationSettings)
    : undefined;

  return {
    id: identifier(row.id, 'OrganizationId') as OrganizationId,
    name: row.name,
    slug: row.slug,
    ...(row.legalName === null ? {} : { legalName: row.legalName }),
    defaultCurrency: row.defaultCurrency,
    fiscalYearStartMonth: row.fiscalYearStartMonth,
    timezone: row.timezone,
    countryCode: row.countryCode,
    ...(settings === undefined ? {} : { settings }),
    ...(row.deletedAt === null ? {} : { deletedAt: row.deletedAt }),
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}
