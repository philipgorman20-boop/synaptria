'use server';

import { ApplicationError } from '@synaptria/application';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';

import {
  ACTIVE_ORGANIZATION_COOKIE,
  getRequestContext,
} from '../../../lib/request-context';
import { getOrganizationService } from '../../../lib/organization-service';

import {
  readCreateOrganizationFormValues,
  validateCreateOrganizationFormValues,
  type CreateOrganizationActionState,
} from './create-organization-form';

const ONE_YEAR_IN_SECONDS = 60 * 60 * 24 * 365;

export async function createOrganizationAction(
  _previousState: CreateOrganizationActionState,
  formData: FormData,
): Promise<CreateOrganizationActionState> {
  const values = readCreateOrganizationFormValues(formData);
  const validation = validateCreateOrganizationFormValues(values);

  if (validation !== undefined) {
    return validation;
  }

  const name = values.name.trim();
  const slug = values.slug.trim();

  try {
    const context = await getRequestContext();
    const result = await getOrganizationService().createOrganization(
      {
        userId: context.userId,
        requestId: context.requestId,
        correlationId: context.correlationId,
      },
      { name, slug },
    );

    const cookieStore = await cookies();
    cookieStore.set(
      ACTIVE_ORGANIZATION_COOKIE,
      result.organization.id,
      {
        httpOnly: true,
        sameSite: 'lax',
        secure: process.env.NODE_ENV === 'production',
        path: '/',
        maxAge: ONE_YEAR_IN_SECONDS,
      },
    );
  } catch (error) {
    if (error instanceof ApplicationError) {
      const field = error.details?.field;
      const applicationFieldErrors =
        field === 'name' || field === 'slug'
          ? { [field]: error.message }
          : error.code === 'CONFLICT'
            ? { slug: error.message }
            : undefined;

      return {
        status: 'error',
        message:
          applicationFieldErrors === undefined
            ? error.message
            : 'Correct the highlighted fields and try again.',
        ...(applicationFieldErrors === undefined
          ? {}
          : { fieldErrors: applicationFieldErrors }),
        values: { name, slug },
      };
    }

    return {
      status: 'error',
      message: 'The organization could not be created. Please try again.',
      values: { name, slug },
    };
  }

  redirect('/dashboard');
}
