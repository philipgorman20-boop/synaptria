import { ApplicationError } from '@synaptria/application';
import { CoreError } from '@synaptria/core/errors';
import { AuthorizationDeniedError } from '@synaptria/core/errors';
import type { VendorCategory } from '@synaptria/domain/vendors';

export interface CreateVendorActionState {
  readonly status: 'idle' | 'error';
  readonly message?: string;
  readonly fieldErrors?: Readonly<{ name?: string; category?: string }>;
  readonly values?: Readonly<{ name: string; category: string; website: string; country: string }>;
}

export interface CreateVendorFormValues {
  readonly name: string;
  readonly category: string;
  readonly website: string;
  readonly country: string;
}

export const initialCreateVendorState: CreateVendorActionState = { status: 'idle' };

export function readCreateVendorFormValues(formData: FormData): CreateVendorFormValues {
  return {
    name: readText(formData, 'name'),
    category: readText(formData, 'category'),
    website: readText(formData, 'website'),
    country: readText(formData, 'country'),
  };
}

export function validateCreateVendorFormValues(
  values: CreateVendorFormValues,
): CreateVendorActionState | undefined {
  const fieldErrors: { name?: string; category?: string } = {};

  if (values.name.trim().length === 0) fieldErrors.name = 'Vendor name is required.';
  if (values.category.trim().length === 0) fieldErrors.category = 'Category is required.';

  if (Object.keys(fieldErrors).length === 0) return undefined;

  return { status: 'error', message: 'Correct the highlighted fields and try again.', fieldErrors, values };
}

export function mapCreateVendorActionError(
  error: unknown,
  values: CreateVendorFormValues,
): CreateVendorActionState | undefined {
  if (error instanceof AuthorizationDeniedError) {
    return { status: 'error', message: 'You do not have permission to create vendors.', values };
  }
  if (error instanceof ApplicationError) {
    const fieldErrors = error.details?.field === 'name' ? { name: error.message } : undefined;
    return {
      status: 'error',
      message: fieldErrors === undefined ? error.message : 'Correct the highlighted fields and try again.',
      ...(fieldErrors === undefined ? {} : { fieldErrors }),
      values,
    };
  }
  if (error instanceof CoreError && error.code === 'CONFLICT') {
    return {
      status: 'error',
      message: 'Correct the highlighted fields and try again.',
      fieldErrors: { name: error.message },
      values,
    };
  }
  return undefined;
}

export function isVendorCategory(value: string): value is VendorCategory {
  return [
    'CRO', 'CDMO', 'CONSULTANT', 'LEGAL', 'REGULATORY', 'CLINICAL',
    'SOFTWARE', 'EQUIPMENT', 'LAB_SUPPLIES', 'FACILITIES', 'FINANCE', 'HR', 'OTHER',
  ].includes(value);
}

function readText(formData: FormData, field: string): string {
  const value = formData.get(field);
  return typeof value === 'string' ? value.trim() : '';
}
