import type {
  MembershipId,
  OrganizationId,
  OrganizationRole,
  UserId,
} from '@synaptria/core';

export type MembershipStatus = 'INVITED' | 'ACTIVE' | 'SUSPENDED' | 'REMOVED';

export interface OrganizationSettings {
  readonly [key: string]: unknown;
}

export interface Organization {
  readonly id: OrganizationId;
  readonly name: string;
  readonly slug: string;
  readonly legalName?: string;
  readonly defaultCurrency: string;
  readonly fiscalYearStartMonth: number;
  readonly timezone: string;
  readonly countryCode: string;
  readonly settings?: OrganizationSettings;
  readonly deletedAt?: Date;
  readonly createdAt: Date;
  readonly updatedAt: Date;
}

export interface OrganizationMembership {
  readonly id: MembershipId;
  readonly organizationId: OrganizationId;
  readonly userId: UserId;
  readonly role: OrganizationRole;
  readonly status: MembershipStatus;
  readonly invitedAt?: Date;
  readonly joinedAt?: Date;
  readonly suspendedAt?: Date;
  readonly createdAt: Date;
  readonly updatedAt: Date;
}

export interface OrganizationSummary {
  readonly organization: Organization;
  readonly membership: OrganizationMembership;
}
