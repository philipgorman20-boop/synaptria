import type {
  MembershipId,
  OrganizationId,
  OrganizationRole,
  UserId,
} from '@synaptria/core';

import type { MembershipStatus, OrganizationMembership } from './models';

export interface AddMembershipInput {
  readonly organizationId: OrganizationId;
  readonly userId: UserId;
  readonly role: OrganizationRole;
  readonly status?: MembershipStatus;
  readonly invitedAt?: Date;
  readonly joinedAt?: Date;
}

export interface MembershipRepository {
  add(input: AddMembershipInput): Promise<OrganizationMembership>;
  findById(id: MembershipId): Promise<OrganizationMembership | null>;
  findForUser(
    organizationId: OrganizationId,
    userId: UserId,
  ): Promise<OrganizationMembership | null>;
  listMembers(organizationId: OrganizationId): Promise<readonly OrganizationMembership[]>;
  listForUser(userId: UserId): Promise<readonly OrganizationMembership[]>;
  updateRole(id: MembershipId, role: OrganizationRole): Promise<OrganizationMembership>;
  updateStatus(
    id: MembershipId,
    status: MembershipStatus,
    changedAt: Date,
  ): Promise<OrganizationMembership>;
  isActiveMember(organizationId: OrganizationId, userId: UserId): Promise<boolean>;
}
