/** Stable permission identifiers used across server-side authorization checks. */
export const PERMISSIONS = {
  ORGANIZATION_READ: 'organization.read',
  ORGANIZATION_UPDATE: 'organization.update',
  ORGANIZATION_MANAGE_MEMBERS: 'organization.manage_members',
  ORGANIZATION_MANAGE_ROLES: 'organization.manage_roles',
  ORGANIZATION_MANAGE_SETTINGS: 'organization.manage_settings',
  ORGANIZATION_TRANSFER_OWNERSHIP: 'organization.transfer_ownership',
  ORGANIZATION_DELETE: 'organization.delete',

  DASHBOARD_READ: 'dashboard.read',

  FINANCE_READ: 'finance.read',
  FINANCE_MANAGE: 'finance.manage',
  FINANCE_APPROVE: 'finance.approve',

  PROGRAMS_READ: 'programs.read',
  PROGRAMS_MANAGE: 'programs.manage',

  VENDORS_READ: 'vendors.read',
  VENDORS_MANAGE: 'vendors.manage',

  DOCUMENTS_READ: 'documents.read',
  DOCUMENTS_UPLOAD: 'documents.upload',
  DOCUMENTS_MANAGE: 'documents.manage',
  DOCUMENTS_DELETE: 'documents.delete',

  REPORTS_READ: 'reports.read',
  REPORTS_GENERATE: 'reports.generate',

  AI_USE: 'ai.use',
  AI_REVIEW: 'ai.review',

  AUDIT_READ: 'audit.read',
  API_KEYS_MANAGE: 'api_keys.manage',
} as const;

export type Permission = (typeof PERMISSIONS)[keyof typeof PERMISSIONS];

export const ALL_PERMISSIONS = Object.freeze(
  Object.values(PERMISSIONS),
) as readonly Permission[];
