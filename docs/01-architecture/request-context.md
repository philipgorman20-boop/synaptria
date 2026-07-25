# Request Context

Authenticated application code must use a resolved request context instead of trusting client-supplied tenant identifiers.

The web application resolves context in this order:

1. Read the Auth.js database session.
2. Load only active memberships for the authenticated user.
3. Optionally honor the `synaptria.organization` cookie when it identifies one of those memberships.
4. Otherwise select the user's first active membership deterministically.
5. Create branded user, organization, membership, request, and correlation identifiers.

The resulting context contains:

- `userId`
- `organizationId`
- `membershipId`
- `role`
- `requestId`
- `correlationId`
- organization display metadata

The organization cookie is only a preference. It is never used directly in a tenant-owned query and cannot grant access to an organization for which the user lacks an active membership.
