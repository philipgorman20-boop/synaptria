# Coding Standards

These standards define how Synaptria code is written, reviewed, and tested. They apply to all contributors and align with the rules in [AGENTS.md](../../AGENTS.md).

## General Principles

1. **Minimize scope.** Keep changes focused. Do not combine unrelated refactors with feature work.
2. **Follow existing patterns.** Read surrounding code before writing. Match naming, types, abstractions, and import style.
3. **Security by default.** Validate input, enforce authorization server-side, and scope every tenant query.
4. **Explicit over implicit.** Prefer typed contracts, discriminated unions, and named errors over loose conventions.
5. **Document behavior changes.** Update relevant docs when architecture or product behavior changes.

## TypeScript

Synaptria uses **TypeScript in strict mode**. Strict mode must remain enabled in all packages.

### Required Practices

- Avoid `any`. Use `unknown` and narrow with type guards when the type is genuinely unknown.
- Export explicit public interfaces from package entry points (`index.ts`).
- Prefer discriminated unions for state, workflow status, and result types.
- Use branded identifier types from `@synaptria/core` (`UserId`, `OrganizationId`, etc.) rather than raw strings for domain identity.
- Parse environment variables at startup in configuration modules; do not read `process.env` ad hoc in business logic.
- Avoid non-null assertions (`!`) except where invariants are proven by preceding checks.

### Error Handling

Expected domain failures use typed errors:

| Error | Package | Use Case |
| --- | --- | --- |
| `CoreError` | `@synaptria/core` | Cross-cutting platform failures (not found, conflict, validation) |
| `ApplicationError` | `@synaptria/application` | Use case-level business rule violations |
| `AuthenticationError` | `@synaptria/auth` | Missing or invalid session |

Use discriminated error codes (`AUTHENTICATION_REQUIRED`, `AUTHORIZATION_DENIED`, `VALIDATION_FAILED`, `NOT_FOUND`, `CONFLICT`, etc.) so delivery layers can map errors to HTTP status codes and user-facing messages consistently.

Programming errors (unexpected nulls, violated invariants) may throw standard `Error`. Do not catch and swallow these silently.

Prefer `Result<T, E>` from `@synaptria/core` in pure functions where throwing is inappropriate.

## Architecture and Layer Rules

### Separation of Concerns

| Concern | Belongs In |
| --- | --- |
| HTTP, rendering, forms | Delivery layer (`apps/web`) |
| Use case orchestration | Application layer (`@synaptria/application`) |
| Business models and repository ports | Domain layer (`@synaptria/domain`) |
| Prisma queries and migrations | Infrastructure layer (`@synaptria/database`) |
| Session and context resolution | `@synaptria/auth` |

Do not create parallel architectural patterns. Extend existing module structures.

### Dependency Rules

- Shared packages must not import application or delivery code.
- Domain must not import Prisma, Next.js, Auth.js, or application modules.
- Application must not import React, Next.js, or the Prisma client directly.
- Route handlers and server actions validate input, authorize, call services, and serialize responses—they do not contain business logic.

### Public APIs

- Only module `index.ts` files in `@synaptria/application` form the supported public API.
- Do not export Prisma model types from shared packages.
- Do not expose sequential internal database IDs to clients when UUIDs are available.

## Multi-Tenancy and Security

### Tenant Isolation

- Every tenant-owned record must include `organizationId`.
- Every query for tenant-owned data must filter by the authenticated `organizationId`.
- Never trust client-supplied organization IDs. Resolve tenant context server-side via `getRequestContext()`.
- The `synaptria.organization` cookie is a UI preference only; validate it against active memberships before use.

### Authorization

- Enforce authorization on the server for every mutating operation and sensitive read.
- Check `Permission` values via `@synaptria/permissions`, not raw role name strings.
- UI permission checks are advisory; users must not be able to bypass restrictions via direct API calls.

### Secrets and Sensitive Data

- Never hardcode secrets, API keys, or credentials.
- Never log secrets, credentials, full tokens, or sensitive document content.
- Treat uploaded files as untrusted. Validate type, size, and content handling at the boundary.
- Use least-privilege access for services and storage.

### Audit

Record important administrative and business actions in the audit log. Audit entries must include actor, action, target, organization scope, and request/correlation identifiers.

## Database

- The Prisma schema is the source of truth. Do not edit the database manually.
- Review migration files before application.
- Add explicit indexes for frequently filtered foreign keys, especially `organizationId`.
- Prefer soft deletion only when business or audit requirements justify it.
- Use transactions for multi-step mutations that must succeed or fail atomically.

See [naming-conventions.md](../02-database/naming-conventions.md) and [migrations.md](../02-database/migrations.md).

## UI and Frontend

- Use shared UI primitives from `@synaptria/ui` and shadcn/ui patterns.
- Style with Tailwind CSS; follow the design system in [04-ui/](../04-ui/).
- Server components are the default. Add `"use client"` only when browser interaction requires it.
- Forms must use accessible labels, keyboard navigation, and server-side validation.
- Include loading, error, empty, and success states for all data-driven views.
- Tables must support responsive behavior.

## AI

- AI output is untrusted until validated against schemas and business rules.
- Use structured outputs where possible.
- Store prompt version, model, timestamps, and status for important AI jobs.
- Human review is required for material decisions.
- Do not allow AI to silently mutate critical business records.
- Separate retrieval, reasoning, and action layers.
- Add evaluation fixtures for material AI workflows.

## Testing

### Requirements

- Unit test domain logic and application use cases.
- Integration test data access, repository adapters, and authorization paths.
- Add end-to-end tests for critical user workflows.
- Always test tenant isolation: verify that queries and mutations cannot cross organization boundaries.
- Always test permission boundaries for each role.

### Conventions

- Colocate tests with the code they cover (e.g., `create-organization.test.ts` next to `create-organization.ts`).
- Use in-memory repository fakes for application unit tests; reserve Prisma integration tests for the database package.
- Avoid brittle snapshot-heavy test suites.
- Tests must be deterministic; inject clock and ID generator dependencies where randomness or time affects behavior.

Run the full check suite before opening a pull request:

```bash
pnpm lint
pnpm typecheck
pnpm test
```

See [testing.md](../05-development/testing.md).

## Git and Code Review

### Branches and Commits

- Use focused feature branches with small, intentional commits.
- Do not combine unrelated refactors and features in the same pull request.
- Write commit messages that explain **why**, not just what changed.

See [git-workflow.md](../05-development/git-workflow.md).

### Pull Requests

Every pull request must include:

- A summary of the change and its motivation
- Test evidence (commands run, results)
- Migration notes when schema changes are included
- Screenshots for UI changes

### Review Checklist

Reviewers evaluate:

- Correctness and edge case handling
- Security and tenant isolation
- Authorization enforcement
- Test coverage for new behavior
- Maintainability and adherence to layer boundaries
- Performance implications for database queries
- Documentation impact

See [code-review.md](../05-development/code-review.md).

## Definition of Done

A feature is complete when:

- Behavior matches documented requirements
- Authorization is enforced on the server
- Tenant isolation is verified by tests
- Tests pass locally and in CI
- Relevant documentation is updated
- No secrets, debug code, or commented-out experiments remain
- Linting and type checks pass

## Naming Conventions

### Files and Modules

- Use kebab-case for file names (`create-organization.ts`, `request-context.ts`)
- Group by product domain under `modules/<domain>/`
- Suffix use case files by intent: commands/queries or descriptive names (`create-organization.ts`, `list-organizations.ts`)

### Types and Classes

- Use PascalCase for classes, interfaces, types, and enums
- Suffix use cases with `UseCase` (e.g., `CreateOrganizationUseCase`)
- Suffix application facades with `Service` (e.g., `OrganizationService`)
- Suffix repository ports with `Repository` and adapters with `Prisma<Name>Repository`

### Database

Follow [naming-conventions.md](../02-database/naming-conventions.md) for table, column, and enum naming in the Prisma schema.

## Comments and Documentation

- Write self-explanatory code; prefer clear naming over comments.
- Add comments only for non-obvious business logic, security constraints, or external system behavior.
- Update architecture and product docs when behavior changes.
- Reference ADRs for significant technical decisions rather than restating rationale inline.

## Further Reading

- [AGENTS.md](../../AGENTS.md) — contributor and agent workflow rules
- [layers.md](./layers.md) — layer responsibilities and dependency matrix
- [system.md](./system.md) — platform architecture overview
- [05-development/](../05-development/) — git workflow, testing, release process, and code review
