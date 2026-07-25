import type { MembershipId, OrganizationId, UserId } from '../ids';

export type OrganizationRole = 'OWNER' | 'ADMIN' | 'MEMBER' | 'VIEWER';

export interface TenantContext {
  userId: UserId;
  organizationId: OrganizationId;
  membershipId: MembershipId;
  role: OrganizationRole;
}
