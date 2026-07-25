import type { Identifier, Role } from '@synaptria/types';

/**
 * Authenticated, tenant-resolved context supplied to application use cases.
 *
 * The web layer is responsible for constructing this context from trusted
 * server-side authentication and membership data. Application services must
 * not accept an organization identity directly from untrusted client input.
 */
export interface ApplicationContext {
  requestId: string;
  correlationId: string;
  userId: Identifier;
  organizationId: Identifier;
  membershipId: Identifier;
  role: Role;
}
