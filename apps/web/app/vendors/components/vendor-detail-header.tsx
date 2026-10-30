import { routes } from '@synaptria/config';
import type { Vendor } from '@synaptria/domain/vendors';
import Link from 'next/link';
import type React from 'react';

import { formatVendorCategory, formatVendorStatus } from '../vendors-format';

export interface VendorDetailHeaderProps {
  readonly vendor: Vendor;
  readonly actions?: React.ReactNode;
}

export function VendorDetailHeader({ vendor, actions }: VendorDetailHeaderProps) {
  return (
    <header className="detail-header">
      <nav aria-label="Vendor navigation" className="detail-breadcrumb">
        <Link className="detail-back-link" href={routes.vendors}>Vendors</Link>
        <span aria-hidden="true" className="detail-breadcrumb-separator">/</span>
        <span aria-current="page">{vendor.name}</span>
      </nav>

      <div className="detail-heading">
        <div className="detail-title-group">
          <p className="eyebrow">VENDOR · {formatVendorCategory(vendor.category)}</p>
          <h1>{vendor.name}</h1>
          {vendor.legalName !== undefined ? (
            <p className="detail-description">{vendor.legalName}</p>
          ) : null}
        </div>
        <div className="detail-heading-aside">
          <span className="detail-status-badge">{formatVendorStatus(vendor.status)}</span>
          {actions}
        </div>
      </div>
    </header>
  );
}
