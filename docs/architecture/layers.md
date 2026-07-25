# Layered Architecture

Synaptria separates concerns into distinct layers with explicit dependency rules. Business logic remains testable and framework-independent while delivery mechanisms (Next.js, Prisma, Auth.js) stay at the edges.

## Layer Overview

```text
┌──────────────────────────────────────────────────────────────┐
│  Delivery Layer                                              │
│  apps/web — pages, layouts, route handlers, server actions   │
└────────────────────────────┬─────────────────────────────────┘
                             │ resolves context, validates input
                             ▼
┌──────────────────────────────────────────────────────────────┐
│  Application Layer                                           │
│  @synaptria/application — use cases, services, orchestration │
└────────────────────────────┬─────────────────────────────────┘
                             │ depends on domain contracts
                             ▼
┌──────────────────────────────────────────────────────────────┐
│  Domain Layer                                                │
│  @synaptria/domain — models, invariants, repository ports    │
└────────────────────────────┬─────────────────────────────────┘
                             │ implemented by
                             ▼
┌──────────────────────────────────────────────────────────────┐
│  Infrastructure Layer                                        │
│  @synaptria/database — Prisma adapters, transactions        │
│  @synaptria/auth — session and context resolution           │
└────────────────────────────┬─────────────────────────────────┘
                             │
                             ▼
┌──────────────────────────────────────────────────────────────┐
│  Persistence and External Systems                            │
│  PostgreSQL, S3, AI providers, message brokers               │
└──────────────────────────────────────────────────────────────┘

        Cross-cutting (used by all layers above persistence):
        @synaptria/core, @synaptria/types, @synaptria/permissions,
        @synaptria/audit, @synaptria/events, @synaptria/validation
```

## Delivery Layer

**Location:** `apps/web`, `apps/marketing`

The delivery layer is responsible for HTTP concerns, rendering, and user interaction. It must remain thin.

### Responsibilities

- Render UI with server components by default; use client components only when browser interaction requires them
- Resolve authenticated request context via `@synaptria/auth` and `apps/web/lib/request-context.ts`
- Validate and parse external input at the boundary
- Authorize using `@synaptria/permissions` before invoking application services
- Map application results and errors to HTTP responses, redirects, or UI state
- Never embed business rules that belong in the application or domain layers

### Patterns

- **Route handlers** (`app/**/route.ts`) for API endpoints and health checks
- **Server actions** (`app/actions/**`) for form submissions and mutations initiated from the UI
- **Server components** for data fetching that does not require client-side interactivity
- **Feature organization** by product domain (organizations, programs, documents, etc.)

### Example Flow

```text
Browser form submit
  → server action validates input
  → getRequestContext() resolves tenant context
  → requirePermission(context, PERMISSIONS.organization.create)
  → OrganizationService.createOrganization(context, input)
  → map result to UI response or redirect
```

Delivery code constructs `ApplicationContext` from trusted server-side authentication data. It must never pass a client-supplied `organizationId` directly into a tenant-scoped query.

## Application Layer

**Location:** `@synaptria/application`

The application layer coordinates business use cases. It orchestrates domain contracts, audit recording, and event publication without knowing about Next.js, React, or Prisma.

### Responsibilities

- Implement commands and queries as use case classes
- Enforce application-level validation and invariants not expressible in the domain alone
- Coordinate transactions through unit-of-work abstractions
- Record audit entries for material mutations
- Publish domain events after successful state changes
- Expose module facades (application services) as the public API for delivery layers

### Module Structure

Each product module evolves toward this internal layout:

```text
modules/<domain>/
  commands/       # write use cases
  queries/        # read use cases
  dto/            # input/output types for delivery layer
  services/       # facades composing use cases
  repositories/   # unit-of-work and port wiring (interfaces only)
  validators/     # application-level validation
  permissions/    # module-specific authorization helpers
  events/         # event payload builders
  errors/         # application error types
  index.ts        # public module API
```

Only module `index.ts` files form the supported public API.

### Key Contracts

**UseCase** — the standard handler contract:

```typescript
interface UseCase<TInput, TOutput> {
  execute(context: ApplicationContext, input: TInput): Promise<TOutput>;
}
```

**ApplicationContext** — authenticated, tenant-resolved context passed to every use case:

```typescript
interface ApplicationContext {
  requestId: string;
  correlationId: string;
  userId: Identifier;
  organizationId: Identifier;
  membershipId: Identifier;
  role: Role;
}
```

### Dependency Rules

- May depend on `@synaptria/domain`, `@synaptria/core`, `@synaptria/types`, `@synaptria/audit`, `@synaptria/events`, and `@synaptria/permissions`
- Must not import React, Next.js, route handlers, or UI components
- Must not expose Prisma models as public DTOs
- Must not import `@synaptria/database` directly; receive repository implementations via constructor injection

### Example: Organization Module

The organization module demonstrates the intended pattern:

- `CreateOrganizationUseCase` validates input, checks slug uniqueness, creates the organization and owner membership inside a unit of work, records an audit entry, and publishes an `organization.created` event
- `OrganizationService` exposes a facade consumed by Next.js server actions
- Repository ports are defined in `@synaptria/domain`; Prisma implementations live in `@synaptria/database`

## Domain Layer

**Location:** `@synaptria/domain`

The domain layer owns framework-independent business models and repository contracts (ports). It expresses what the business is, not how data is stored or displayed.

### Responsibilities

- Define entity and value object types with business meaning
- Declare repository interfaces (ports) for persistence operations
- Encode domain invariants where they are stable and reusable
- Remain free of infrastructure, UI, and application orchestration concerns

### Dependency Rules

- May depend on `@synaptria/core` for shared primitives (branded IDs, typed errors)
- Must not depend on Prisma, Next.js, Auth.js, `@synaptria/application`, or `@synaptria/database`
- Must not perform I/O

### Current Modules

| Module | Contents |
| --- | --- |
| `organization` | Organization and membership models, organization and membership repository contracts |

Additional domain modules (programs, projects, documents, vendors, etc.) will follow the same pattern as product features are implemented.

## Infrastructure Layer

**Location:** `@synaptria/database`, `@synaptria/auth`, and future adapter packages

The infrastructure layer implements domain and cross-cutting ports using concrete technologies.

### Database Package (`@synaptria/database`)

- Owns the Prisma schema and migration files
- Exports the Prisma client and transaction utilities
- Implements domain repository contracts (e.g., `PrismaOrganizationRepository`, `PrismaMembershipRepository`)
- Implements audit and event persistence adapters
- Scopes all tenant-owned queries by `organizationId`

Persistence adapters translate between Prisma models and domain types. Prisma models must not leak into application or delivery layers.

### Auth Package (`@synaptria/auth`)

- Integrates Auth.js for session management
- Resolves organization membership and builds trusted context objects
- Provides helpers such as `selectOrganizationMembership` and `buildOrganizationContext`

### Planned Infrastructure

- S3 document storage adapter
- Background job worker integration
- Email and notification delivery adapters

## Cross-Cutting Packages

These packages provide shared capabilities used across layers. They follow the same inward dependency rule: they must not import delivery or application code.

| Package | Role |
| --- | --- |
| `@synaptria/core` | Branded identifiers, typed errors (`CoreError`), `Result<T, E>`, pagination, clock abstraction |
| `@synaptria/types` | Shared TypeScript types (`Role`, `Identifier`, etc.) |
| `@synaptria/permissions` | Permission constants, role mappings, and enforcement helpers |
| `@synaptria/audit` | Audit recording service and repository port |
| `@synaptria/events` | Event envelope creation, serialization, idempotency, and publishing service |
| `@synaptria/validation` | Shared validation utilities |
| `@synaptria/config` | Environment and configuration parsing |
| `@synaptria/ui` | Shared React components for delivery layers |
| `@synaptria/ai` | Prompt management, structured AI outputs, retrieval orchestration |

### Permissions

Authorization checks happen in the application or delivery layer using `@synaptria/permissions`:

- Callers pass a trusted tenant context resolved from authentication
- Code checks `Permission` values, not raw role strings
- `OWNER` is the only role permitted to transfer ownership or delete an organization

### Audit

Material mutations record audit entries through `AuditService`. Each entry includes organization scope, actor, action, target entity, request/correlation IDs, and optional before/after snapshots.

### Events

State changes publish domain events through `DomainEventService`. Events carry tenant identity, aggregate type and ID, typed payload, and optional idempotency keys to prevent duplicate publication.

## Dependency Matrix

Allowed dependency direction (row may depend on column):

|  | core | types | domain | application | database | auth | web |
| --- | :-: | :-: | :-: | :-: | :-: | :-: | :-: |
| **core** | — | | | | | | |
| **types** | ✓ | — | | | | | |
| **domain** | ✓ | ✓ | — | | | | |
| **application** | ✓ | ✓ | ✓ | — | | | |
| **database** | ✓ | ✓ | ✓ | | — | | |
| **auth** | ✓ | ✓ | | | ✓ | — | |
| **web** | ✓ | ✓ | | ✓ | ✓ | ✓ | — |

Packages such as `audit`, `events`, and `permissions` sit alongside `core` and may be consumed by `application` and `web` but must not depend on `application` or `web`.

**Prohibited:**

- Circular dependencies between packages
- Shared packages importing application code
- Domain importing infrastructure
- Application importing Prisma client or Next.js APIs
- Trusting client-supplied tenant identifiers

## Multi-Tenancy Across Layers

Tenant isolation is enforced at every layer:

| Layer | Enforcement |
| --- | --- |
| Delivery | Resolve context server-side; never use client `organizationId` in queries |
| Application | Accept `ApplicationContext` with verified `organizationId`; pass it to all repository calls |
| Domain | Model tenant ownership explicitly (`organizationId` on tenant-owned entities) |
| Infrastructure | Include `organizationId` in every query filter and composite index strategy |
| Audit/Events | Propagate organization, actor, request, and correlation identity in every record |

## Testing by Layer

| Layer | Test Focus |
| --- | --- |
| Domain | Unit tests for invariants and model behavior |
| Application | Unit tests for use cases with in-memory repository fakes |
| Infrastructure | Integration tests for Prisma adapters, tenant scoping, and transactions |
| Delivery | Integration and end-to-end tests for auth, permissions, and critical workflows |

Always test tenant isolation and permission boundaries.

## Adding a New Feature

1. **Domain** — define models and repository ports in `@synaptria/domain`
2. **Infrastructure** — implement Prisma adapters in `@synaptria/database`
3. **Application** — add use cases, validation, audit, and events in `@synaptria/application`
4. **Delivery** — add server actions, pages, and UI in `apps/web`
5. **Permissions** — add permission constants and role mappings in `@synaptria/permissions`
6. **Documentation** — update product and architecture docs

Follow this sequence to avoid leaking infrastructure concerns into business logic.

## Further Reading

- [system.md](./system.md) — platform overview and component topology
- [coding-standards.md](./coding-standards.md) — implementation conventions
- [domain-layer.md](../01-architecture/domain-layer.md)
- [backend.md](../01-architecture/backend.md)
- [frontend.md](../01-architecture/frontend.md)
