'use server';

import { vendorRoute, routes } from '@synaptria/config';
import { type VendorId } from '@synaptria/core';
import { revalidatePath } from 'next/cache';

import { toUpdateVendorContext } from '../../../lib/vendor-context';
import { getRequestContext } from '../../../lib/request-context';
import { getVendorService } from '../../../lib/vendor-service';

import {
  isVendorCategory,
  isVendorStatus,
  mapUpdateVendorActionError,
  readUpdateVendorFormValues,
  validateUpdateVendorFormValues,
  type UpdateVendorActionState,
} from './update-vendor-form';

export async function updateVendorAction(
  vendorId: VendorId,
  _previousState: UpdateVendorActionState,
  formData: FormData,
): Promise<UpdateVendorActionState> {
  const values = readUpdateVendorFormValues(formData);
  const validation = validateUpdateVendorFormValues(values);

  if (validation !== undefined) return validation;

  if (!isVendorCategory(values.category)) {
    return {
      status: 'error',
      message: 'Invalid category.',
      fieldErrors: { category: 'Please select a valid category.' },
      values,
    };
  }

  try {
    const context = await getRequestContext();
    await getVendorService().updateVendor(toUpdateVendorContext(context), {
      vendorId,
      name: values.name,
      category: values.category,
      ...(isVendorStatus(values.status) ? { status: values.status } : {}),
      ...(values.website.length > 0 ? { website: values.website } : { website: null }),
      ...(values.email.length > 0 ? { email: values.email } : { email: null }),
      ...(values.phone.length > 0 ? { phone: values.phone } : { phone: null }),
      ...(values.country.length > 0 ? { country: values.country } : { country: null }),
      ...(values.city.length > 0 ? { city: values.city } : { city: null }),
      ...(values.notes.length > 0 ? { notes: values.notes } : { notes: null }),
    });

    revalidatePath(routes.vendors);
    revalidatePath(vendorRoute(vendorId));
  } catch (error) {
    const mapped = mapUpdateVendorActionError(error, values);
    if (mapped !== undefined) return mapped;

    return {
      status: 'error',
      message: 'The vendor could not be updated. Please try again.',
      values,
    };
  }

  return { status: 'success' };
}
