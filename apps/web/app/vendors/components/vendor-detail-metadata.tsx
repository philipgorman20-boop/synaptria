import type { Vendor } from '@synaptria/domain/vendors';

import { formatVendorCategory, formatVendorDate, formatVendorStatus } from '../vendors-format';

export interface VendorDetailMetadataProps {
  readonly vendor: Vendor;
}

export function VendorDetailMetadata({ vendor }: VendorDetailMetadataProps) {
  return (
    <section aria-labelledby="vendor-detail-metadata-heading" className="detail-metadata">
      <h2 id="vendor-detail-metadata-heading">Vendor details</h2>

      <dl className="detail-metadata-list">
        <div className="detail-field">
          <dt>Status</dt>
          <dd>{formatVendorStatus(vendor.status)}</dd>
        </div>
        <div className="detail-field">
          <dt>Category</dt>
          <dd>{formatVendorCategory(vendor.category)}</dd>
        </div>
        {vendor.website !== undefined ? (
          <div className="detail-field">
            <dt>Website</dt>
            <dd><a href={vendor.website} target="_blank" rel="noopener noreferrer">{vendor.website}</a></dd>
          </div>
        ) : null}
        {vendor.email !== undefined ? (
          <div className="detail-field">
            <dt>Email</dt>
            <dd><a href={`mailto:${vendor.email}`}>{vendor.email}</a></dd>
          </div>
        ) : null}
        {vendor.phone !== undefined ? (
          <div className="detail-field">
            <dt>Phone</dt>
            <dd>{vendor.phone}</dd>
          </div>
        ) : null}
        {vendor.country !== undefined ? (
          <div className="detail-field">
            <dt>Country</dt>
            <dd>{vendor.country}</dd>
          </div>
        ) : null}
        {vendor.city !== undefined ? (
          <div className="detail-field">
            <dt>City</dt>
            <dd>{vendor.city}</dd>
          </div>
        ) : null}
        {vendor.paymentTermsDays !== undefined ? (
          <div className="detail-field">
            <dt>Payment terms</dt>
            <dd>Net {vendor.paymentTermsDays}</dd>
          </div>
        ) : null}
        {vendor.notes !== undefined ? (
          <div className="detail-field detail-field--full">
            <dt>Notes</dt>
            <dd>{vendor.notes}</dd>
          </div>
        ) : null}
        <div className="detail-field">
          <dt>Created</dt>
          <dd>{formatVendorDate(vendor.createdAt)}</dd>
        </div>
        <div className="detail-field">
          <dt>Updated</dt>
          <dd>{formatVendorDate(vendor.updatedAt)}</dd>
        </div>
      </dl>
    </section>
  );
}
