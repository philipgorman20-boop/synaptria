import type { OrganizationId, UserId } from '@synaptria/core';

import type { Organization, OrganizationSettings, OrganizationSummary } from './models';

export interface CreateOrganizationInput {
  readonly name: string;
  readonly slug: string;
  readonly legalName?: string;
  readonly defaultCurrency?: string;
  readonly fiscalYearStartMonth?: number;
  readonly timezone?: string;
  readonly countryCode?: string;
  readonly settings?: OrganizationSettings;
}

export interface UpdateOrganizationInput {
  readonly name?: string;
  readonly slug?: string;
  readonly legalName?: string | null;
  readonly defaultCurrency?: string;
  readonly fiscalYearStartMonth?: number;
  readonly timezone?: string;
  readonly countryCode?: string;
  readonly settings?: OrganizationSettings | null;
}

export interface OrganizationRepository {
  create(input: CreateOrganizationInput): Promise<Organization>;
  findById(id: OrganizationId): Promise<Organization | null>;
  findBySlug(slug: string): Promise<Organization | null>;
  update(id: OrganizationId, input: UpdateOrganizationInput): Promise<Organization>;
  softDelete(id: OrganizationId, deletedAt: Date): Promise<Organization>;
  listForUser(userId: UserId): Promise<readonly OrganizationSummary[]>;
}
