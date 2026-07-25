import {
  membershipId,
  organizationId,
  type CorrelationId,
  type OrganizationRole,
  type RequestContext,
  type RequestId,
  userId,
} from '@synaptria/core';

export interface OrganizationMembershipCandidate {
  readonly id: string;
  readonly userId: string;
  readonly organizationId: string;
  readonly role: OrganizationRole;
  readonly organization: {
    readonly name: string;
    readonly slug: string;
  };
}

export interface ResolvedOrganizationContext extends RequestContext {
  readonly organizationName: string;
  readonly organizationSlug: string;
}

export class OrganizationMembershipRequiredError extends Error {
  constructor(message = 'An active organization membership is required.') {
    super(message);
    this.name = 'OrganizationMembershipRequiredError';
  }
}

export function selectOrganizationMembership(
  memberships: readonly OrganizationMembershipCandidate[],
  preferredOrganizationId?: string,
): OrganizationMembershipCandidate {
  if (memberships.length === 0) {
    throw new OrganizationMembershipRequiredError();
  }

  if (preferredOrganizationId) {
    const preferred = memberships.find(
      (membership) => membership.organizationId === preferredOrganizationId,
    );

    if (preferred) {
      return preferred;
    }
  }

  const firstMembership = memberships[0];

  if (!firstMembership) {
    throw new OrganizationMembershipRequiredError();
  }

  return firstMembership;
}

export function buildOrganizationContext(input: {
  readonly membership: OrganizationMembershipCandidate;
  readonly requestId: RequestId;
  readonly correlationId: CorrelationId;
}): ResolvedOrganizationContext {
  const { membership, requestId, correlationId } = input;

  return {
    userId: userId(membership.userId),
    organizationId: organizationId(membership.organizationId),
    membershipId: membershipId(membership.id),
    role: membership.role,
    requestId,
    correlationId,
    organizationName: membership.organization.name,
    organizationSlug: membership.organization.slug,
  };
}
