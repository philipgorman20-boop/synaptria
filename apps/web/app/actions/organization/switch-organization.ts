'use server';

import { organizationId } from '@synaptria/core';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';

import {
  ACTIVE_ORGANIZATION_COOKIE,
  getRequestContext,
} from '../../../lib/request-context';
import { getOrganizationService } from '../../../lib/organization-service';

const ONE_YEAR_IN_SECONDS = 60 * 60 * 24 * 365;

export async function switchOrganizationAction(
  formData: FormData,
): Promise<void> {
  const rawOrganizationId = formData.get('organizationId');

  if (
    typeof rawOrganizationId !== 'string' ||
    rawOrganizationId.trim().length === 0
  ) {
    throw new Error('A valid organization ID is required.');
  }

  const context = await getRequestContext();
  const result = await getOrganizationService().switchOrganization(
    {
      userId: context.userId,
      requestId: context.requestId,
      correlationId: context.correlationId,
      currentOrganizationId: context.organizationId,
    },
    {
      organizationId: organizationId(rawOrganizationId.trim()),
    },
  );

  if (!result.ok) {
    throw new Error(result.error.message);
  }

  const cookieStore = await cookies();
  cookieStore.set(
    ACTIVE_ORGANIZATION_COOKIE,
    result.value.organization.id,
    {
      httpOnly: true,
      sameSite: 'lax',
      secure: process.env.NODE_ENV === 'production',
      path: '/',
      maxAge: ONE_YEAR_IN_SECONDS,
    },
  );

  redirect('/dashboard');
}
