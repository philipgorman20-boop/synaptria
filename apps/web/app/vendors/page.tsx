import {
  AuthenticationError,
  OrganizationMembershipRequiredError,
  type ResolvedOrganizationContext,
} from '@synaptria/auth';
import { routes } from '@synaptria/config';
import type { Vendor } from '@synaptria/domain/vendors';
import Link from 'next/link';
import { redirect } from 'next/navigation';

import { toListVendorsContext } from '../../lib/vendor-context';
import { getVendorService } from '../../lib/vendor-service';
import { getRequestContext } from '../../lib/request-context';

import { getVendorDetailHref } from './vendors-format';

import { CreateVendorDialog } from './components/create-vendor-dialog';

export default async function VendorsPage() {
  let context: ResolvedOrganizationContext;

  try {
    context = await getRequestContext();
  } catch (error) {
    if (error instanceof AuthenticationError) redirect('/sign-in');
    if (error instanceof OrganizationMembershipRequiredError) redirect('/no-organization');
    throw error;
  }

  const result = await getVendorService().listVendors(toListVendorsContext(context));
  const vendors = result.vendors.filter(isVisibleVendor);

  return (
    <main className="dashboard">
      <div className="page-header">
        <div>
          <h1>Vendors</h1>
          <p className="page-subtitle">
            {vendors.length} {vendors.length === 1 ? 'vendor' : 'vendors'} in {context.organizationName}
          </p>
        </div>
        <div className="page-header-actions">
          <CreateVendorDialog />
          <Link className="secondary-button" href={routes.dashboard}>Dashboard</Link>
        </div>
      </div>

      {vendors.length === 0 ? (
        <div className="empty-state">
          <h2>No vendors yet</h2>
          <p>Add CROs, CDMOs, consultants, and other external partners to your vendor registry.</p>
        </div>
      ) : (
        <section aria-label="Vendors">
          <table className="data-table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Category</th>
                <th>Status</th>
                <th>Country</th>
              </tr>
            </thead>
            <tbody>
              {vendors.map((vendor) => (
                <tr key={vendor.id}>
                  <td><Link href={getVendorDetailHref(vendor.id)}>{vendor.name}</Link></td>
                  <td>{vendor.category}</td>
                  <td>{vendor.status}</td>
                  <td>{vendor.country ?? '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>
      )}
    </main>
  );
}

function isVisibleVendor(vendor: Vendor): boolean {
  return vendor.deletedAt === undefined;
}
