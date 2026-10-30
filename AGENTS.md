# AGENTS.md

## 1. Project Context

Synaptria is an enterprise, multi-tenant SaaS platform for biotech organizations. It is intended to become the operating system for program execution, project management, vendor coordination, document intelligence, reporting, and decision support.

The product is not an ELN or LIMS. It coordinates work across scientific, operational, financial, and external partner workflows.

## 2. Product Principles

1. Enterprise-first
2. AI-native
3. Secure by default
4. Multi-tenant by design
5. Opinionated but configurable
6. Auditable
7. Fast and accessible
8. Modular and extensible

## 3. Technology Stack

- Next.js App Router
- React
- TypeScript in strict mode
- Tailwind CSS
- shadcn/ui
- PostgreSQL
- Prisma ORM
- pnpm workspaces
- Turborepo
- Docker Compose
- GitHub Actions
- OpenAI Responses API
- S3-compatible object storage

## 4. Required Workflow

Before implementing a feature:

1. Read the relevant documents in `docs/`.
2. Review related ADRs.
3. Identify affected packages and data models.
4. Confirm tenant isolation requirements.
5. Reuse existing patterns and components.
6. Keep the change focused.
7. Add or update tests.
8. Update documentation when behavior changes.

## 5. Architecture Rules

- Keep UI, domain logic, persistence, and integrations separate.
- Use server components by default where appropriate.
- Use client components only when interaction requires them.
- Put reusable domain logic in services, not route handlers.
- Route handlers should validate input, authorize, call services, and return typed responses.
- Do not create parallel architectural patterns.
- Avoid circular dependencies between packages.
- Shared packages may not import application code.

## 6. Database Rules

- Prisma schema is the source of truth.
- Do not edit the database manually.
- Every tenant-owned record must include `organizationId`.
- Every query for tenant-owned data must scope by `organizationId`.
- Use explicit indexes for frequently filtered foreign keys.
- Prefer soft deletion only when business or audit needs justify it.
- Migration files must be reviewed before application.
- Never expose sequential internal IDs to clients when UUIDs are available.

## 7. Security Rules

- Never hardcode secrets.
- Never log secrets, credentials, full tokens, or sensitive document content.
- Validate all external input.
- Enforce authorization on the server.
- Do not trust client-supplied organization IDs.
- Record important administrative and business actions in the audit log.
- Treat uploaded files as untrusted.
- Use least-privilege access for services and storage.

## 8. TypeScript Rules

- Strict mode must remain enabled.
- Avoid `any`.
- Prefer discriminated unions for state and workflow types.
- Export explicit public interfaces.
- Avoid non-null assertions except where invariants are proven.
- Parse environment variables at startup.
- Use typed errors for expected domain failures.

## 9. UI Rules

- Use shared UI primitives.
- Use Tailwind for styling.
- Maintain keyboard accessibility.
- Include loading, error, empty, and success states.
- Avoid dense visual clutter despite the information-rich nature of the product.
- Tables must support responsive behavior.
- Forms must use accessible labels and server-side validation.

## 10. AI Rules

- AI output is untrusted until validated.
- Use structured outputs where possible.
- Store prompt version, model, timestamps, and status for important AI jobs.
- Human review is required for material decisions.
- Do not allow AI to silently mutate critical business records.
- Separate retrieval, reasoning, and action layers.
- Add evaluation fixtures for material AI workflows.

## 11. Testing Rules

- Unit test domain logic.
- Integration test data access and authorization.
- Add end-to-end tests for critical workflows.
- Test tenant isolation.
- Test permission boundaries.
- Avoid brittle snapshot-heavy test suites.

## 12. Git Rules

- Use focused feature branches.
- Write small, intentional commits.
- Do not combine unrelated refactors and features.
- Pull requests must include summary, test evidence, migration notes, and screenshots where relevant.

## 13. Definition of Done

A feature is complete when:

- behavior matches the documented requirements,
- authorization is enforced,
- tenant isolation is verified,
- tests pass,
- relevant docs are updated,
- no secrets or debug code remain,
- linting and type checks pass.
