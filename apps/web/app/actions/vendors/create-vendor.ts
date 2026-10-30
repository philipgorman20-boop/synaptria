'use server';

import { routes } from '@synaptria/config';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';

import { toCreateVendorContext } from '../../../lib/vendor-context';
import { getRequestContext } from '../../../lib/request-context';
import { getVendorService } from '../../../lib/vendor-service';

import {
  isVendorCategory,
  mapCreateVendorActionError,
  readCreateVendorFormValues,
  validateCreateVendorFormValues,
  type CreateVendorActionState,
} from './create-vendor-form';

export async function createVendorAction(
  _previousState: CreateVendorActionState,
  formData: FormData,
): Promise<CreateVendorActionState> {
  const values = readCreateVendorFormValues(formData);
  const validation = validateCreateVendorFormValues(values);

  if (validation !== undefined) return validation;

  if (!isVendorCategory(values.category)) {
    return {
      status: 'error',
      message: 'Invalid vendor category.',
      fieldErrors: { category: 'Please select a valid category.' },
      values,
    };
  }

  try {
    const context = await getRequestContext();
    await getVendorService().createVendor(toCreateVendorContext(context), {
      name: values.name,
      category: values.category,
      ...(values.website.length === 0 ? {} : { website: values.website }),
      ...(values.country.length === 0 ? {} : { country: values.country }),
    });

    revalidatePath(routes.vendors);
    revalidatePath(routes.dashboard);
  } catch (error) {
    const mapped = mapCreateVendorActionError(error, values);
    if (mapped !== undefined) return mapped;

    return {
      status: 'error',
      message: 'The vendor could not be created. Please try again.',
      values,
    };
  }

  redirect(routes.vendors);
}
