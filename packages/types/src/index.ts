export type Identifier = string;

export type Role = 'OWNER' | 'ADMIN' | 'MEMBER' | 'VIEWER';

export interface TenantContext {
  organizationId: Identifier;
  userId: Identifier;
  role: Role;
}
