# System Architecture

Synaptria is built as a **modular monolith**: a single deployable application with explicit domain boundaries and clear package ownership. This approach reduces operational complexity during early product development while preserving extraction paths when scale or operational boundaries justify separate services.

See [ADR-0003: Modular Monolith](../ADR/0003-modular-monolith.md) for the decision record.

## Mission and Scope

Synaptria aims to become the AI operating system for biotech program execution. The platform connects scientific operations, vendors, finances, risks, documents, decisions, and reporting into a single multi-tenant environment.

The product is **enterprise-first**, **AI-native**, **secure by default**, and **multi-tenant by design**. Every architectural choice should reinforce auditability, tenant isolation, and long-term maintainability.

## High-Level Topology

```text
┌─────────────────────────────────────────────────────────────────┐
│                        Client (Browser)                         │
└───────────────────────────────┬─────────────────────────────────┘
                                │
                                ▼
┌─────────────────────────────────────────────────────────────────┐
│  apps/web — Next.js App Router                                  │
│  Server components, route handlers, server actions              │
└───────────────────────────────┬─────────────────────────────────┘
                                │
          ┌─────────────────────┼─────────────────────┐
          ▼                     ▼                     ▼
┌──────────────────┐  ┌──────────────────┐  ┌──────────────────┐
│ @synaptria/      │  │ @synaptria/      │  │ @synaptria/      │
│ application      │  │ auth             │  │ permissions      │
└────────┬─────────┘  └────────┬─────────┘  └──────────────────┘
         │                     │
         ▼                     ▼
┌──────────────────┐  ┌──────────────────┐  ┌──────────────────┐
│ @synaptria/      │  │ @synaptria/      │  │ @synaptria/      │
│ domain           │  │ audit            │  │ events           │
└────────┬─────────┘  └────────┬─────────┘  └────────┬─────────┘
         │                     │                     │
         └─────────────────────┼─────────────────────┘
                               ▼
                    ┌──────────────────┐
                    │ @synaptria/      │
                    │ database         │
                    │ (Prisma adapters)│
                    └────────┬─────────┘
                             ▼
                    ┌──────────────────┐
                    │ PostgreSQL       │
                    └──────────────────┘
```

External integrations attach at the application and infrastructure boundaries:

- **S3-compatible object storage** for documents and file uploads
- **OpenAI Responses API** (via `@synaptria/ai`) for AI-assisted workflows
- **Background job infrastructure** for asynchronous processing (planned expansion)
- **Notification services** for operational alerts (planned expansion)

## Repository Structure

Synaptria is a **pnpm workspace** managed by **Turborepo**.

### Applications

| Path | Purpose |
| --- | --- |
| `apps/web` | Primary Next.js application for authenticated product use |
| `apps/marketing` | Public marketing site |
| `apps/docs` | Future documentation site |

### Shared Packages

| Package | Responsibility |
| --- | --- |
| `@synaptria/core` | Cross-cutting primitives: branded IDs, typed errors, pagination, time |
| `@synaptria/domain` | Framework-independent business models and repository contracts |
| `@synaptria/application` | Use cases, application services, and orchestration |
| `@synaptria/database` | Prisma client, migrations, and persistence adapters |
| `@synaptria/auth` | Authentication integration and organization context resolution |
| `@synaptria/permissions` | Role and permission policy |
| `@synaptria/audit` | Audit recording contracts and service |
| `@synaptria/events` | Domain event contracts, envelopes, and publishing |
| `@synaptria/ai` | AI services and prompt infrastructure |
| `@synaptria/ui` | Shared UI components (shadcn/ui-based) |
| `@synaptria/config` | Shared configuration |
| `@synaptria/types` | Shared TypeScript types |
| `@synaptria/validation` | Shared validation utilities |

Shared packages must not import application code. Dependency direction flows inward toward domain and core contracts.

## Core Platform Components

### Web Application

The primary delivery surface is a **Next.js App Router** application in `apps/web`. Server components are the default; client components are used only when interaction requires browser-side state. Route handlers and server actions validate input, resolve authenticated request context, authorize, invoke application services, and return typed responses.

### Data Layer

**PostgreSQL** is the system of record. **Prisma** is the ORM and schema source of truth. Every tenant-owned record includes `organizationId`. All queries for tenant-owned data must scope by the authenticated organization. Migration files are reviewed before application; the database is never edited manually.

### Authentication and Tenant Context

Authentication is integrated via Auth.js in `@synaptria/auth`. Authenticated code resolves a trusted request context server-side:

1. Read the Auth.js database session.
2. Load active memberships for the authenticated user.
3. Optionally honor the `synaptria.organization` cookie when it identifies a valid membership.
4. Otherwise select the user's first active membership deterministically.
5. Construct branded user, organization, membership, request, and correlation identifiers.

The organization cookie is a **preference only**. It is never used directly in tenant queries and cannot grant access to organizations where the user lacks an active membership.

See [request-context.md](../01-architecture/request-context.md) for full details.

### Authorization

Authorization is enforced on the server using `@synaptria/permissions`. Initial roles are Owner, Admin, Member, and Viewer. Application code checks permissions, not raw role names. UI permission checks are advisory; the server is authoritative.

See [authorization.md](../01-architecture/authorization.md).

### Audit Logging

Important administrative and business actions are recorded through `@synaptria/audit`. Audit entries carry actor identity, action, target entity, request/correlation IDs, and before/after snapshots where appropriate. Persistence adapters live in `@synaptria/database`.

### Domain Events

State changes that other parts of the system may react to are published through `@synaptria/events`. Events are tenant-aware, versioned, and carry idempotency support. The events package is persistence-independent; Prisma adapters and background workers belong in infrastructure packages.

### AI Integration

AI capabilities use versioned prompts, structured outputs, retrieval from authorized tenant data, background jobs, and evaluation fixtures. AI output is untrusted until validated. AI must not bypass permissions or silently mutate critical business records. Human review is required for material decisions.

See [ai-architecture.md](../01-architecture/ai-architecture.md).

### Document Storage

Uploaded files are treated as untrusted. Documents are stored in S3-compatible object storage with metadata tracked in PostgreSQL. Access is scoped to the owning organization.

## API and Integration Design

- Stable typed contracts between layers
- Structured error responses with machine-readable codes
- Server-side authorization on every mutating operation
- Input validation at delivery boundaries
- Idempotency for important writes
- Pagination for collection endpoints

See [api.md](../01-architecture/api.md).

## Deployment and Environments

Initial environments:

| Environment | Purpose |
| --- | --- |
| Local | Developer machines with Docker Compose for PostgreSQL |
| Preview | Pull request and staging validation |
| Production | Customer-facing deployment |

Docker Compose provides local database dependencies. GitHub Actions runs lint, typecheck, test, and build tasks via Turborepo. Production hosting remains an ADR decision.

See [deployment.md](../01-architecture/deployment.md).

## Technology Stack

| Layer | Technology |
| --- | --- |
| Frontend | Next.js, React, TypeScript, Tailwind CSS, shadcn/ui |
| Backend | Next.js route handlers and server actions |
| Database | PostgreSQL, Prisma ORM |
| Monorepo | pnpm workspaces, Turborepo |
| Local infrastructure | Docker Compose |
| CI/CD | GitHub Actions |
| AI | OpenAI Responses API |
| Storage | S3-compatible object storage |

See [ADR-0001: Initial Technology Stack](../ADR/0001-tech-stack.md).

## Evolution Strategy

Services may be separated later only when scale or operational boundaries justify the added complexity. Until then, domain boundaries are enforced through package structure, dependency rules, and code review—not through network boundaries.

When extracting a service:

1. Identify a module with a stable domain contract and minimal coupling.
2. Move persistence adapters behind an interface already defined in domain or application layers.
3. Introduce an API or message contract without changing business logic semantics.
4. Maintain tenant isolation and audit/event propagation across the boundary.

## Further Reading

- [layers.md](./layers.md) — detailed layer responsibilities and dependency rules
- [coding-standards.md](./coding-standards.md) — implementation conventions
- [domain-layer.md](../01-architecture/domain-layer.md) — domain package design
- [backend.md](../01-architecture/backend.md) — route handler and service patterns
- [frontend.md](../01-architecture/frontend.md) — UI architecture
