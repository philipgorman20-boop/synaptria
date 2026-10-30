import { ApplicationError } from '@synaptria/application';
import { AuthorizationDeniedError } from '@synaptria/core/errors';
import type { VendorCategory, VendorStatus } from '@synaptria/domain/vendors';

export interface UpdateVendorActionState {
  readonly status: 'idle' | 'success' | 'error';
  readonly message?: string;
  readonly fieldErrors?: Readonly<{ name?: string; category?: string }>;
  readonly values?: Readonly<{
    name: string;
    category: string;
    status: string;
    website: string;
    email: string;
    phone: string;
    country: string;
    city: string;
    notes: string;
  }>;
}

export interface UpdateVendorFormValues {
  readonly name: string;
  readonly category: string;
  readonly status: string;
  readonly website: string;
  readonly email: string;
  readonly phone: string;
  readonly country: string;
  readonly city: string;
  readonly notes: string;
}

export const initialUpdateVendorState: UpdateVendorActionState = { status: 'idle' };

export function readUpdateVendorFormValues(formData: FormData): UpdateVendorFormValues {
  return {
    name: readText(formData, 'name'),
    category: readText(formData, 'category'),
    status: readText(formData, 'status'),
    website: readText(formData, 'website'),
    email: readText(formData, 'email'),
    phone: readText(formData, 'phone'),
    country: readText(formData, 'country'),
    city: readText(formData, 'city'),
    notes: readText(formData, 'notes'),
  };
}

export function validateUpdateVendorFormValues(
  values: UpdateVendorFormValues,
): UpdateVendorActionState | undefined {
  const fieldErrors: { name?: string; category?: string } = {};

  if (values.name.trim().length === 0) fieldErrors.name = 'Vendor name is required.';
  if (values.category.trim().length === 0) fieldErrors.category = 'Category is required.';

  if (Object.keys(fieldErrors).length === 0) return undefined;

  return {
    status: 'error',
    message: 'Correct the highlighted fields and try again.',
    fieldErrors,
    values,
  };
}

export function mapUpdateVendorActionError(
  error: unknown,
  values: UpdateVendorFormValues,
): UpdateVendorActionState | undefined {
  if (error instanceof AuthorizationDeniedError) {
    return { status: 'error', message: 'You do not have permission to update vendors.', values };
  }

  if (error instanceof ApplicationError) {
    return { status: 'error', message: error.message, values };
  }

  return undefined;
}

export function isVendorCategory(value: string): value is VendorCategory {
  return [
    'CRO', 'CDMO', 'CONSULTANT', 'LEGAL', 'REGULATORY', 'CLINICAL',
    'SOFTWARE', 'EQUIPMENT', 'LAB_SUPPLIES', 'FACILITIES', 'FINANCE', 'HR', 'OTHER',
  ].includes(value);
}

export function isVendorStatus(value: string): value is VendorStatus {
  return ['PROSPECTIVE', 'QUALIFYING', 'APPROVED', 'ACTIVE', 'SUSPENDED', 'INACTIVE', 'ARCHIVED'].includes(value);
}

function readText(formData: FormData, field: string): string {
  const value = formData.get(field);
  return typeof value === 'string' ? value.trim() : '';
}
