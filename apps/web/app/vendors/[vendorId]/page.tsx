import { ApplicationError } from '@synaptria/application';
import {
  AuthenticationError,
  OrganizationMembershipRequiredError,
  type ResolvedOrganizationContext,
} from '@synaptria/auth';
import { notFound, redirect } from 'next/navigation';

import { toGetVendorContext } from '../../../lib/vendor-context';
import { getVendorService } from '../../../lib/vendor-service';
import { getRequestContext } from '../../../lib/request-context';
import { parseVendorRouteParam } from '../vendors-format';

import { DeleteVendorDialog } from '../components/delete-vendor-dialog';
import { EditVendorDialog } from '../components/edit-vendor-dialog';
import { VendorDetailHeader } from '../components/vendor-detail-header';
import { VendorDetailMetadata } from '../components/vendor-detail-metadata';

export interface VendorDetailPageProps {
  readonly params: Promise<{ readonly vendorId: string }>;
}

export default async function VendorDetailPage({ params }: VendorDetailPageProps) {
  const { vendorId: rawVendorId } = await params;
  const vendorId = parseVendorRouteParam(rawVendorId);

  if (vendorId === null) notFound();

  let context: ResolvedOrganizationContext;

  try {
    context = await getRequestContext();
  } catch (error) {
    if (error instanceof AuthenticationError) redirect('/sign-in');
    if (error instanceof OrganizationMembershipRequiredError) redirect('/no-organization');
    throw error;
  }

  let vendor;

  try {
    ({ vendor } = await getVendorService().getVendor(toGetVendorContext(context), { vendorId }));
  } catch (error) {
    if (error instanceof ApplicationError && error.code === 'NOT_FOUND') notFound();
    throw error;
  }

  return (
    <main className="dashboard">
      <VendorDetailHeader vendor={vendor} actions={<><EditVendorDialog vendor={vendor} /><DeleteVendorDialog vendor={vendor} /></>} />
      <VendorDetailMetadata vendor={vendor} />
    </main>
  );
}
