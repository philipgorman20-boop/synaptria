import {
  auth,
  buildOrganizationContext,
  AuthenticationError,
  selectOrganizationMembership,
  type OrganizationMembershipCandidate,
  type ResolvedOrganizationContext,
} from '@synaptria/auth';
import { createCorrelationId, createRequestId, correlationId, requestId } from '@synaptria/core';
import { db } from '@synaptria/database';
import { cookies, headers } from 'next/headers';

export const ACTIVE_ORGANIZATION_COOKIE = 'synaptria.organization';

export async function getRequestContext(): Promise<ResolvedOrganizationContext> {
  const session = await auth();

  if (!session?.user?.id) {
    throw new AuthenticationError();
  }

  const [requestHeaders, cookieStore] = await Promise.all([headers(), cookies()]);
  const preferredOrganizationId = cookieStore.get(ACTIVE_ORGANIZATION_COOKIE)?.value;

  const memberships = await db.membership.findMany({
    where: {
      userId: session.user.id,
      status: 'ACTIVE',
      organization: {
        deletedAt: null,
      },
    },
    orderBy: [{ joinedAt: 'asc' }, { createdAt: 'asc' }],
    select: {
      id: true,
      userId: true,
      organizationId: true,
      role: true,
      organization: {
        select: {
          name: true,
          slug: true,
        },
      },
    },
  });

  const membership = selectOrganizationMembership(
    memberships satisfies readonly OrganizationMembershipCandidate[],
    preferredOrganizationId,
  );

  const incomingRequestId = requestHeaders.get('x-request-id');
  const incomingCorrelationId = requestHeaders.get('x-correlation-id');

  return buildOrganizationContext({
    membership,
    requestId: incomingRequestId ? requestId(incomingRequestId) : createRequestId(),
    correlationId: incomingCorrelationId
      ? correlationId(incomingCorrelationId)
      : createCorrelationId(),
  });
}
