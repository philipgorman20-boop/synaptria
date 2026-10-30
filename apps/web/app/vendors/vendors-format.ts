import { appConfig, vendorRoute } from '@synaptria/config';
import { vendorId, type VendorId } from '@synaptria/core';
import type { VendorCategory, VendorStatus } from '@synaptria/domain/vendors';

const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

const VENDOR_STATUS_LABELS: Record<VendorStatus, string> = {
  PROSPECTIVE: 'Prospective',
  QUALIFYING: 'Qualifying',
  APPROVED: 'Approved',
  ACTIVE: 'Active',
  SUSPENDED: 'Suspended',
  INACTIVE: 'Inactive',
  ARCHIVED: 'Archived',
};

const VENDOR_CATEGORY_LABELS: Record<VendorCategory, string> = {
  CRO: 'CRO',
  CDMO: 'CDMO',
  CONSULTANT: 'Consultant',
  LEGAL: 'Legal',
  REGULATORY: 'Regulatory',
  CLINICAL: 'Clinical',
  SOFTWARE: 'Software',
  EQUIPMENT: 'Equipment',
  LAB_SUPPLIES: 'Lab Supplies',
  FACILITIES: 'Facilities',
  FINANCE: 'Finance',
  HR: 'HR',
  OTHER: 'Other',
};

export function formatVendorStatus(status: VendorStatus): string {
  return VENDOR_STATUS_LABELS[status];
}

export function formatVendorCategory(category: VendorCategory): string {
  return VENDOR_CATEGORY_LABELS[category];
}

export function formatVendorDate(date: Date): string {
  return new Intl.DateTimeFormat(appConfig.defaultLocale, { dateStyle: 'medium' }).format(date);
}

export function getVendorDetailHref(id: VendorId): string {
  return vendorRoute(id);
}

export function parseVendorRouteParam(raw: string | undefined): VendorId | null {
  if (typeof raw !== 'string') return null;
  const normalized = raw.trim();
  if (!UUID_PATTERN.test(normalized)) return null;
  return vendorId(normalized);
}
