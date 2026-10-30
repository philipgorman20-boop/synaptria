'use server';

import { redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';
import { routes } from '@synaptria/config';
import type { VendorId } from '@synaptria/core';

import { toDeleteVendorContext } from '../../../lib/vendor-context';
import { getRequestContext } from '../../../lib/request-context';
import { getVendorService } from '../../../lib/vendor-service';
import type { DeleteVendorActionState } from './delete-vendor-form';

export async function deleteVendorAction(
  vendorId: VendorId,
  _previousState: DeleteVendorActionState,
): Promise<DeleteVendorActionState> {
  try {
    const context = await getRequestContext();
    await getVendorService().deleteVendor(toDeleteVendorContext(context), { vendorId });
    revalidatePath(routes.vendors);
  } catch {
    return { status: 'error', message: 'The vendor could not be deleted. Please try again.' };
  }

  redirect(routes.vendors);
}
