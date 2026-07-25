'use server';

import { ApplicationError } from '@synaptria/application';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';

import {
  ACTIVE_ORGANIZATION_COOKIE,
  getRequestContext,
} from '../../../lib/request-context';
import { getOrganizationService } from '../../../lib/organization-service';

const ONE_YEAR_IN_SECONDS = 60 * 60 * 24 * 365;

export interface CreateOrganizationActionState {
  readonly status: 'idle' | 'error';
  readonly message?: string;
  readonly fieldErrors?: Readonly<{
    name?: string;
    slug?: string;
  }>;
  readonly values?: Readonly<{
    name: string;
    slug: string;
  }>;
}

export const initialCreateOrganizationState: CreateOrganizationActionState = {
  status: 'idle',
};

export async function createOrganizationAction(
  _previousState: CreateOrganizationActionState,
  formData: FormData,
): Promise<CreateOrganizationActionState> {
  const name = readText(formData, 'name');
  const slug = readText(formData, 'slug');
  const values = { name, slug };

  const fieldErrors: { name?: string; slug?: string } = {};

  if (name.length === 0) {
    fieldErrors.name = 'Organization name is required.';
  }

  if (slug.length === 0) {
    fieldErrors.slug = 'Workspace slug is required.';
  } else if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug)) {
    fieldErrors.slug =
      'Use lowercase letters, numbers, and single hyphens only.';
  }

  if (Object.keys(fieldErrors).length > 0) {
    return {
      status: 'error',
      message: 'Correct the highlighted fields and try again.',
      fieldErrors,
      values,
    };
  }

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
        values,
      };
    }

    return {
      status: 'error',
      message: 'The organization could not be created. Please try again.',
      values,
    };
  }

  redirect('/dashboard');
}

function readText(formData: FormData, field: string): string {
  const value = formData.get(field);
  return typeof value === 'string' ? value.trim() : '';
}
