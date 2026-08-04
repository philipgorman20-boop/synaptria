# Domain Model Assessment

**Status:** Assessment (read-only review)  
**Branch inspected:** `docs/domain-model-assessment` @ `c0b5c86`  
**Date:** 2026-07-29  
**Scope:** Architecture-to-domain-model alignment. No code, schema, migration, or test changes were made.

## Document sources

| Document | Location on inspected branch | Notes |
| --- | --- | --- |
| AI philosophy | Not on disk | Read from `docs/ai-operating-system:docs/03-product/ai-philosophy.md` (**Status: Proposed**) |
| Architecture overview | Not on disk | Placeholder only on `docs/ai-operating-system` (`# Architecture Overview`) |
| Context engine | Not on disk | Read from `docs/ai-operating-system:docs/01-architecture/context-engine.md` (**Status: Accepted**) |
| Organizational memory | Not on disk | Placeholder only on `docs/ai-operating-system` |
| Reasoning layer | Not on disk | Placeholder only on `docs/ai-operating-system` |
| Recommendation engine | Not on disk | Placeholder only on `docs/ai-operating-system` |
| Event system | Not on disk | Placeholder only on `docs/ai-operating-system` |
| Provider platform | Not on disk | Placeholder only on `docs/ai-operating-system` |
| Layered architecture | `docs/architecture/layers.md` | Canonical dependency and module pattern guidance |
| Domain layer | `docs/01-architecture/domain-layer.md` | Short package boundary statement |
| Request context | `docs/01-architecture/request-context.md` | Accepted tenant resolution flow |
| Database schema doc | `docs/02-database/schema.md` | **Outdated** relative to Prisma schema |
| Product stubs | `docs/03-product/*.md` | High-level one-liners for most domains |

**Cross-branch note (confirmed via `git diff docs/domain-model-assessment feature/tasks`):** The `feature/tasks` branch contains substantial in-flight work (milestones/tasks domain, persistence, application, permissions, web UI, and Prisma migrations) that is **not** present on the inspected branch. Findings below describe the inspected branch unless explicitly labeled as *inference from `feature/tasks`*.

---

## 1. Executive Summary

Synaptria’s **implemented** domain model is a small, well-structured vertical slice: **Organization**, **Membership**, **Program**, and **Project**, following a modular monolith with explicit repository ports, application use cases, Prisma adapters, audit recording, and domain event publication.

The **Prisma schema** (`packages/database/prisma/schema.prisma`) is a much larger **target v3 architecture** with 40+ models spanning execution, finance, vendors, documents, reporting, AI traceability, audit/events, and ledger concerns. Most of these models have **no domain, application, or delivery implementation** on the inspected branch.

The **AI operating system** architecture (Observe → Understand → Recommend → Act → Learn) is documented in product/architecture docs on the `docs/ai-operating-system` branch, with the **Context Engine** as the most mature specification. **No Context Engine, Organizational Memory, Reasoning Layer, Recommendation Engine, or Provider Platform code exists** in the repository on the inspected branch.

**Highest-risk gaps:**

1. **Schema–code divergence:** Database migrations create tables (e.g., `Milestone`, `Vendor`, `Document`, `AiRun`) that application code never reads or writes, increasing migration risk and developer confusion.
2. **Documentation drift:** `docs/02-database/schema.md` and `docs/architecture/layers.md` understate implemented modules and misstate Milestone/Task as future-only.
3. **Delivery-layer persistence access:** `apps/web/lib/request-context.ts` queries Prisma directly for memberships instead of using a repository or auth service abstraction.
4. **Event model impedance:** Domain event envelopes carry fields (`actorId`, `requestId`, `idempotencyKey`, `occurredAt`) that are partially stored inside JSON metadata in `PrismaEventRepository` rather than as first-class columns.
5. **In-flight branch divergence:** `feature/tasks` introduces domain models whose enums and field names **do not align** with the current Prisma `Milestone` model (*inference from branch comparison*; requires reconciliation before merge).

**Recommended posture:** Preserve the existing layered architecture and Programs/Projects vertical-slice pattern. Evolve incrementally: align documentation, finish execution hierarchy (Milestones → Tasks) against the **existing Prisma models where possible**, then add platform services (event consumer, context assembly) before broad finance/vendor/document domains.

---

## 2. Current Domain Architecture

### Layering (confirmed)

The repository implements the modular monolith described in `docs/architecture/layers.md` and ADR-0003:

```text
apps/web (delivery)
  → @synaptria/application (use cases, services, unit of work)
    → @synaptria/domain (models, repository ports)
      ← @synaptria/database (Prisma adapters)
```

Cross-cutting packages in active use: `@synaptria/core`, `@synaptria/auth`, `@synaptria/permissions`, `@synaptria/audit`, `@synaptria/events`.

### Pattern in practice (confirmed)

Each shipped write use case (e.g., `CreateProgramUseCase`, `CreateProjectUseCase`) follows:

1. `requirePermission` with organization role from trusted context
2. Input normalization and application-level validation
3. Uniqueness / referential checks via repository ports
4. Transaction via module-specific unit of work
5. `AuditService.record` for material mutations
6. `DomainEventService.publish` with typed aggregate metadata
7. Branded IDs applied at persistence boundaries via `identifier()` from `@synaptria/core`

Evidence: `packages/application/src/modules/programs/create-program.ts`, `packages/application/src/modules/projects/create-project.ts`.

### Domain style (confirmed + inference)

- **Confirmed:** Domain types are TypeScript interfaces with string-literal status enums; no framework imports in `@synaptria/domain`.
- **Confirmed:** No explicit DDD aggregate classes, domain services, or command/query type objects—use cases play the command role.
- **Inference:** The team treats each tenant-owned entity (Program, Project) as a **logical aggregate root** for events and audit, but child entities (future Milestone, Task) are not yet modeled in domain on this branch.

---

## 3. Existing Bounded Contexts

| Bounded context | Purpose (from docs/schema) | Implementation status | Evidence |
| --- | --- | --- | --- |
| **Identity & tenant** | Users, sessions, organizations, memberships | **Partial** — org create/list/switch; Auth.js users/sessions in Prisma; membership repo exists but no full member-admin use cases | `packages/domain/src/organization/`, `packages/auth/`, `apps/web/lib/request-context.ts` |
| **Execution / portfolio** | Programs, projects, milestones, tasks, deliverables, dependencies, risks, decisions | **Partial** — programs & projects E2E; milestones/tasks Prisma-only | Domain/application through projects; Prisma `Milestone`+ in schema |
| **Finance** | Budgets, expenses, cash, ledger | **Schema only** | Prisma models; `packages/application/src/modules/finance/index.ts` stub |
| **Vendors & procurement** | Vendors, contracts, POs, invoices | **Schema only** | Prisma models; vendors application stub |
| **Documents & intelligence** | Documents, versions, AI extraction | **Schema only** | Prisma models; documents application stub |
| **Reporting** | Executive reports | **Schema only** | Prisma `ExecutiveReport`; reporting stub |
| **Platform governance** | API keys, audit, domain events, idempotency | **Partial** — audit/event packages + Prisma adapters; no delivery UI or consumers | `@synaptria/audit`, `@synaptria/events`, `packages/database/src/audit/`, `events/` |
| **AI execution** | AiRun traceability, prompts, review | **Schema only** | Prisma `AiRun`, `AIExtraction`; `@synaptria/ai` is README-only |
| **AI operating system** | Context engine, memory, reasoning, recommendations | **Documentation only** (mostly on `docs/ai-operating-system`) | No matching package or module in codebase |

**Uncertainty:** Product docs (`docs/03-product/*.md`) do not define explicit bounded-context boundaries. Context boundaries above are **inferred** from Prisma model groupings and application module stubs.

---

## 4. Existing Entities

### Implemented in domain layer (confirmed)

| Entity | Module | Key fields | Tenant-owned |
| --- | --- | --- | --- |
| `Organization` | `organization` | `id`, `name`, `slug`, settings, soft delete | N/A (is tenant root) |
| `OrganizationMembership` | `organization` | `organizationId`, `userId`, `role`, `status` | Yes |
| `Program` | `programs` | `organizationId`, `ownerId?`, status, priority, therapeutic metadata | Yes |
| `Project` | `projects` | `organizationId`, `programId?`, `ownerId?`, status, priority, `% complete` | Yes |

Evidence: `packages/domain/src/organization/models.ts`, `programs/models.ts`, `projects/models.ts`.

### Prisma-only entities (confirmed — no domain counterpart on inspected branch)

All models in `packages/database/prisma/schema.prisma` except those mapped above, including but not limited to: `User`, `Account`, `Session`, `Team`, `TeamMember`, `Milestone`, `Deliverable`, `Dependency`, `Risk`, `Decision`, finance models, vendor models, document models, `ApiKey`, `AuditEvent`, `DomainEvent`, `IdempotencyKey`, ledger models, `AiRun`, `AIExtraction`, `ExecutiveReport`.

**Note:** There is **no `Task` model** in the Prisma schema on the inspected branch (*confirmed via grep*). The `feature/tasks` branch adds it (*inference from `git diff`*).

### Auth/session entities (confirmed)

`User`, `Account`, `Session`, `VerificationToken` live in Prisma for Auth.js. They are **not** exported from `@synaptria/domain`. *Inference:* intentionally infrastructure/auth concerns, not business domain entities yet.

---

## 5. Existing Aggregates and Aggregate Roots

Synaptria does not implement explicit aggregate types. The following **logical** aggregate map is inferred from repository boundaries, audit targets, and domain event `aggregateType` values:

| Aggregate root | Consistency boundary (inferred) | Children in schema (not in domain) | Event / audit evidence |
| --- | --- | --- | --- |
| **Organization** | Org profile + initial owner membership on create | Memberships, teams, all tenant data (FK) | `organization.created` — `packages/application/src/modules/organization/create-organization.ts` |
| **Program** | Program record; optional link to projects | Projects, milestones, risks, … | `program.created`; aggregateType `Program` |
| **Project** | Project record; optional program FK validation on create | Milestones, deliverables, dependencies, … | `project.created`; aggregateType `Project` |
| **Milestone** (schema) | *Not implemented* — Prisma allows optional `programId` and `projectId` | Deliverables, linked risks/decisions | None on inspected branch |
| **Vendor**, **Document**, **Budget**, etc. | *Not implemented* | Various | None |

**Confirmed fact:** Write use cases validate parent existence (e.g., program must exist before project create) but do **not** load aggregate graphs or enforce invariants across children.

**Inference:** Milestones on `feature/tasks` treat **Project** as the parent boundary (`projectId` required in domain) — closer to execution tree `Program → Project → Milestone → Task` than Prisma’s optional dual parent on `Milestone`.

---

## 6. Existing Value Objects

| Concept | Location | Status | Notes |
| --- | --- | --- | --- |
| Branded identifiers (`OrganizationId`, `ProgramId`, …) | `@synaptria/core` | **Implemented** | `packages/core/src/ids/identifier.ts` |
| `RequestId`, `CorrelationId` | `@synaptria/core` | **Implemented** | Propagated through context, audit, events |
| Status enums (Program, Project, Membership) | `@synaptria/domain` | **Implemented** | String union types, mirrored in Prisma enums |
| Priority (`LOW`…`CRITICAL`) | Domain modules + Prisma `Priority` enum | **Duplicated** | Separate `ProgramPriority` / `ProjectPriority` types identical to Prisma |
| `OrganizationSettings` | Domain | **Weakly typed** | `{ readonly [key: string]: unknown }` |
| Slug, currency, timezone | Plain strings on entities | **No dedicated VO types** | Validation lives in application use cases |
| Money / dates / percentages | Prisma + plain `number`/`Date` | **No domain VOs** | `% complete` is unchecked beyond application validation |

**Confirmed:** No shared value-object module beyond branded IDs. `packages/domain/src/shared/` does **not** exist on the inspected branch (*inference:* `feature/tasks` adds `shared/priority.ts`).

---

## 7. Repository and Persistence Boundaries

### Repository ports (domain)

| Port | File |
| --- | --- |
| `OrganizationRepository` | `packages/domain/src/organization/organization-repository.ts` |
| `MembershipRepository` | `packages/domain/src/organization/membership-repository.ts` |
| `ProgramRepository` | `packages/domain/src/programs/program-repository.ts` |
| `ProjectRepository` | `packages/domain/src/projects/project-repository.ts` |

### Prisma implementations (database)

| Adapter | File | Tenant scoping |
| --- | --- | --- |
| `PrismaOrganizationRepository` | `packages/database/src/organization/prisma-organization-repository.ts` | User-scoped list; org by id |
| `PrismaMembershipRepository` | `packages/database/src/organization/prisma-membership-repository.ts` | By org + user |
| `PrismaProgramRepository` | `packages/database/src/programs/prisma-program-repository.ts` | **`organizationId` on all queries**; soft-delete filter |
| `PrismaProjectRepository` | `packages/database/src/projects/prisma-project-repository.ts` | Same pattern |
| `PrismaAuditRepository` | `packages/database/src/audit/prisma-audit-repository.ts` | Org-scoped create |
| `PrismaEventRepository` | `packages/database/src/events/prisma-event-repository.ts` | Org-scoped create/query |

Transaction wiring: `packages/database/src/transaction.ts` exposes `createPersistenceRepositories` and `withDatabaseTransaction`.

### Unit of work (application)

| Module | Write UoW | Read pattern |
| --- | --- | --- |
| Organization | `organization-unit-of-work.ts` | Direct repo injection |
| Programs | `program-unit-of-work.ts` | Direct repo injection |
| Projects | `project-unit-of-work.ts` | Direct repo injection |

**Confirmed:** Application layer does not import `@prisma/client`. Composition roots in `apps/web/lib/*-service.ts` wire Prisma implementations.

---

## 8. Prisma Model Inventory

Full schema: `packages/database/prisma/schema.prisma` (comment: *“Generated as a clean target architecture. Validate before creating migrations.”*).

Applied migration on inspected branch: **`20260725015903_init` only** — creates the **entire** v3 schema in one migration.

| Category | Models |
| --- | --- |
| Auth | `User`, `Account`, `Session`, `VerificationToken` |
| Tenant & access | `Organization`, `Membership`, `Team`, `TeamMember` |
| Execution | `Program`, `Project`, `Milestone`, `Deliverable`, `Dependency`, `Risk`, `Decision` |
| Finance | `CashAccount`, `Investor`, `FundingRound`, `FundingCommitment`, `Grant`, `RevenueEvent`, `BudgetCategory`, `Budget`, `BudgetLine`, `Expense`, `Commitment`, `Forecast`, `ForecastScenario`, `ForecastLine` |
| Vendors | `Vendor`, `VendorContact`, `Quote`, `Contract`, `StatementOfWork`, `StatementOfWorkDeliverable`, `PurchaseOrder`, `Invoice`, `VendorPerformanceReview` |
| Documents | `Document`, `DocumentVersion`, `DocumentLink`, `AIExtraction` |
| Reporting | `ExecutiveReport` |
| Platform | `ApiKey`, `AuditEvent`, `DomainEvent`, `IdempotencyKey` |
| Ledger | `LedgerAccount`, `LedgerTransaction`, `LedgerEntry` |
| AI | `AiRun` |

**Task model:** Absent on inspected branch. Added on `feature/tasks` (*branch diff*).

---

## 9. Tenant and Authorization Boundaries

### Tenant resolution (confirmed)

Flow matches `docs/01-architecture/request-context.md`:

1. Auth.js session → `apps/web/lib/request-context.ts`
2. Active memberships loaded (soft-deleted orgs excluded)
3. Cookie preference `synaptria.organization` honored when valid
4. Deterministic fallback to first membership
5. `buildOrganizationContext` in `@synaptria/auth` produces branded context

**Boundary concern (confirmed):** Step 2 uses `db.membership.findMany` directly in the delivery layer rather than `MembershipRepository` or an auth-scoped query service.

### Authorization (confirmed)

- Permissions defined in `packages/permissions/src/permissions.ts`
- Role mappings in `packages/permissions/src/roles.ts` (`OWNER`, `ADMIN`, `MEMBER`, `VIEWER`)
- Enforcement via `requirePermission` in application use cases
- **No** resource-level ownership checks beyond setting `ownerId` on create (*inference:* owners do not confer edit rights separate from role permissions)

### Tenant isolation in persistence (confirmed)

Program and project repositories always filter by `organizationId` and `deletedAt: null`. Tests explicitly cover cross-tenant isolation: `packages/database/src/programs/prisma-program-repository.test.ts`.

### AI architecture tenant requirements (from docs — not implemented)

Context Engine doc requires permission-aware context assembly with no unauthorized facts in reasoning requests (`docs/ai-operating-system:docs/01-architecture/context-engine.md`). **No code path implements this yet.**

---

## 10. Architectural Concepts Already Implemented

| Concept | Evidence |
| --- | --- |
| Modular monolith with package boundaries | `docs/ADR/0003-modular-monolith.md`, `docs/architecture/layers.md` |
| Repository ports + Prisma adapters | Domain and database packages |
| Branded tenant/user IDs | `@synaptria/core` |
| Server-side request context | `apps/web/lib/request-context.ts`, `@synaptria/auth` |
| Role-based permissions | `@synaptria/permissions` |
| Audit trail for mutations | `@synaptria/audit`, wired in create use cases |
| Domain events on mutation | `@synaptria/events`, `program.created`, `project.created`, `organization.created` |
| Unit of work / transactions | `withDatabaseTransaction`, module UoW interfaces |
| Soft delete pattern | `deletedAt` on Program, Project, Organization |
| Vertical slice delivery | Programs and Projects UI + server actions |
| Idempotency interface for events | `packages/events/src/idempotency.ts` (`InMemoryEventIdempotencyStore`; Prisma store not present) |
| AI guardrails (high level) | `docs/01-architecture/ai-architecture.md`, AGENTS.md AI rules |

---

## 11. Architectural Concepts Partially Implemented

| Concept | Current state | Gap |
| --- | --- | --- |
| **Product domain coverage** | 4 domain entities implemented | 40+ Prisma models without domain/application |
| **Application module layout** | Full modules: organization, programs, projects | Stubs only: ai, dashboard, documents, finance, reporting, vendors |
| **Domain events pipeline** | Events persisted as `PENDING` | No consumer/worker, no outbox processor (*inference*) |
| **Event idempotency** | Interface + in-memory store | No `IdempotencyKey` Prisma adapter wired to `DomainEventService` |
| **Audit read path** | Write-only adapter | `AUDIT_READ` permission exists; no query use cases or UI |
| **Membership administration** | Repository methods exist | No invite/manage use cases in application layer |
| **Teams** | Prisma `Team`, `TeamMember` | No domain or authorization integration |
| **Execution hierarchy** | Prisma Milestone (+ Deliverable, Dependency, Risk, Decision) | No domain/repos/use cases on inspected branch |
| **AI traceability schema** | `AiRun`, `AIExtraction` models | No `@synaptria/ai` implementation |
| **Context Engine** | Accepted architecture doc | No package, no context package type, no retrieval orchestration |
| **Organizational Memory** | Named in Context Engine doc | Placeholder doc only; no storage model |
| **Documentation accuracy** | Multiple doc locations | `docs/02-database/schema.md`, `docs/architecture/layers.md` stale vs code |

---

## 12. Missing Architectural Concepts

Derived from architecture/product docs and AGENTS.md — **not invented**:

| Concept | Source | Code status |
| --- | --- | --- |
| **AI Operating Loop** (Observe → Understand → Recommend → Act → Learn) | `docs/03-product/ai-philosophy.md` (ai-operating-system branch) | Not implemented |
| **Context Package** (immutable, permission-aware, provenance) | Context Engine doc | Not implemented |
| **Reasoning Layer** | Placeholder architecture doc | Not implemented |
| **Recommendation Engine** | Placeholder architecture doc | Not implemented |
| **Event System** (operational event bus feeding context) | Placeholder + Context Engine diagram | Domain events table only; no pub/sub or handlers |
| **Provider Platform** (modular LLM/providers) | Placeholder architecture doc | Not implemented |
| **Organizational Memory** (curated institutional knowledge) | Context Engine principles | Not implemented |
| **Background job infrastructure** | `docs/01-architecture/system-architecture.md` | Not present in packages |
| **S3 document storage adapter** | system-architecture.md, layers.md | Not present |
| **Row-level security** | Schema comment only | Application-level scoping only |
| **Task entity** | Product doc `docs/03-product/tasks.md` | Missing from Prisma on inspected branch |
| **Prepared Actions / human review workflow** | AI philosophy | Not implemented |
| **Evaluation fixtures for AI** | AGENTS.md, ai-architecture.md | Not implemented |

---

## 13. Persistence Leakage or Boundary Violations

| Issue | Severity | Evidence | Fact vs inference |
| --- | --- | --- | --- |
| Direct Prisma in delivery layer for memberships | Medium | `apps/web/lib/request-context.ts` imports `db` from `@synaptria/database` | **Confirmed** |
| Domain event fields stored in JSON metadata bucket | Medium | `INTERNAL_METADATA_KEY` in `packages/database/src/events/prisma-event-repository.ts` | **Confirmed** |
| `DomainEvent` / `AuditEvent` optional `programId` columns | Low–Medium | Schema lines ~2044–2075, ~2015–2016 | **Confirmed** — purpose unclear; not set by current use cases |
| Prisma client exported as singleton from database package | Low | `packages/database/src/index.ts` — consumed by web delivery | **Confirmed** — convenient but broadens delivery access surface |
| Full schema migrated before feature implementation | High | Single init migration creates all tables | **Confirmed** |
| Anemic domain (no invariant enforcement in domain) | Low | Validation primarily in application layer | **Confirmed** — consistent with current pattern, not necessarily a violation |
| `feature/tasks` domain Milestone shape vs Prisma | High (if merged without reconciliation) | Branch diff: status enums and date fields differ | **Inference** from `git show feature/tasks:...` |

---

## 14. Naming and Terminology Inconsistencies

| Area | Variant A | Variant B | Location |
| --- | --- | --- | --- |
| Architecture docs path | `docs/01-architecture/` | `docs/architecture/` | Both exist; README links to `docs/architecture/` |
| AI product doc path | `docs/03-product/ai-philosophy.md` (ai-operating-system) | Missing on inspected branch | Branch divergence |
| Milestone status (Prisma) | `NOT_STARTED`, `AT_RISK`, … | `PLANNED`, … (*feature/tasks* domain) | Schema vs in-flight branch |
| Milestone dates (Prisma) | `targetDate`, `completedAt`, `percentComplete` | `plannedStartDate`, `plannedEndDate`, … (*feature/tasks*) | Schema vs in-flight branch |
| Priority typing | Shared Prisma `Priority` enum | Separate `ProgramPriority`, `ProjectPriority` domain aliases | Domain modules |
| AI job naming | `AIJob` in outdated schema doc | `AiRun` in Prisma | `docs/02-database/schema.md` vs schema |
| Aggregate naming in events | `aggregateType: 'Program'` | Prisma model `Program` | Consistent today |
| Module vs bounded context | Application `modules/vendors` | Product “Vendors” | Stubs vs product docs — terminology aligned, implementation missing |
| “Future entities” doc | Lists Milestone, Task as future | Milestone in Prisma + migration | `docs/02-database/schema.md` |

---

## 15. Risks

| Risk | Likelihood | Impact | Mitigation direction |
| --- | --- | --- | --- |
| Developers query Prisma directly for new features, bypassing ports | Medium | High — tenant leaks, untested paths | Enforce composition roots; lint/rule against `db` import in `apps/web` except approved files |
| Large dormant schema confuses domain boundaries | High | Medium | Update docs; mark models as “target” vs “implemented”; consider schema comments/codegen markers |
| Merge `feature/tasks` without enum/FK alignment | Medium | High — runtime mapping bugs, bad migrations | Reconcile domain to Prisma **before** merge; prefer Prisma as source of truth per AGENTS.md |
| Domain events never consumed | Medium | Medium — AI loop “Observe” stage blocked | Implement minimal event dispatcher + handler registry |
| Context Engine built ad hoc in route handlers | Medium | High — permission leaks to AI | Introduce `@synaptria/context` (or similar) package early with tests |
| Audit/event metadata JSON hacks become permanent | Medium | Low–Medium | Plan forward migration to first-class columns when event pipeline stabilizes |
| Init migration already applied broadly | Low | High if rollback needed | Forward-only migrations; feature flags for new tables usage |
| Duplicate documentation misleads agents/contributors | High | Medium | Consolidate `docs/architecture` → `docs/01-architecture`; merge ai-operating-system docs |

---

## 16. Recommended Domain Model

Recommendations favor **incremental evolution** and **preserve working patterns**. Prisma schema v3 is treated as the **persistence source of truth** (per AGENTS.md), with domain types adapted via mappers—not parallel divergent models.

### Core execution tree (priority)

```text
Organization (tenant root)
  └── Program (optional portfolio grouping)
        └── Project
              └── Milestone
                    └── Task   ← add via migration on feature/tasks merge
```

**Recommendations:**

1. **Adopt Project-scoped Milestones** as the primary boundary (*matches `feature/tasks` direction*). Use Prisma `Milestone.projectId` as required at application level even though schema allows null (*inference:* enforce in use case, not schema change initially).
2. **Map domain types to Prisma enums** for Milestone (`MilestoneStatus`, `Priority`) rather than introducing parallel enum sets. Deprecate divergent statuses on `feature/tasks` during merge.
3. **Introduce `Task` model** aligned with product doc: status, due dates, owner, milestone FK — follow `feature/tasks` branch but reconcile field names to Prisma once Task migration lands.
4. **Keep Organization, Program, Project** as separate aggregate roots** with existing repository/use-case pattern.
5. **Treat Deliverable, Dependency, Risk, Decision** as **sibling modules** under Project/Milestone—not embedded in Project aggregate—until cross-entity rules are specified in product docs.
6. **Do not model finance/vendor/document entities in domain** until corresponding product docs and ADRs define MVP scope.

### Platform domain (parallel track)

| Concept | Recommended representation |
| --- | --- |
| Context Package | Immutable DTO in new package (e.g. `@synaptria/context`); not a Prisma entity |
| Organizational Memory | Defer dedicated storage until doc moves beyond placeholder; *uncertainty* whether memory is document-derived vs curated entries |
| AiRun | Map 1:1 to Prisma `AiRun` when AI module starts; domain type mirrors trace fields |
| DomainEvent | Keep `@synaptria/events` envelope as domain concept; Prisma row is infrastructure |

### Shared kernels

- **`Priority`**: Export single domain type from `@synaptria/domain/shared` (*pattern started on feature/tasks*) used by Program, Project, Milestone, Task.
- **Branded IDs**: Continue `@synaptria/core` pattern; add `MilestoneId`, `TaskId` (*on feature/tasks*).

---

## 17. Recommended Implementation Sequence

| Phase | Scope | Rationale |
| --- | --- | --- |
| **0 — Doc & branch hygiene** | Merge ai-operating-system docs; update `docs/02-database/schema.md`, `layers.md`; resolve `docs/architecture` duplication | Reduces agent/contributor error without code risk |
| **1 — Complete execution MVP** | Merge/reconcile `feature/tasks`: Milestone + Task domain, repos, application, permissions (`MILESTONES_*`, `TASKS_*`), web UI | Closes largest schema–code gap; aligns with product tasks doc |
| **2 — Event consumption** | Background worker or in-process dispatcher reading `DomainEvent` `PENDING` rows; register handlers for `*.created` | Enables Observe stage for AI loop |
| **3 — Context Engine v0** | Read-only context assembler: load authorized Program/Project/Milestone/Task + recent audit/events; produce Context Package DTO | Implements Accepted architecture doc minimally |
| **4 — Audit & membership admin** | List audit events; invite/manage members | Security/compliance baseline |
| **5 — Vendor MVP** | Vendor domain slice (Prisma `Vendor` already exists) | Partner coordination per product vision |
| **6 — Document + AiRun slice** | Upload metadata, `AiRun` trace on extraction jobs | Needed before document intelligence |
| **7 — Finance (deferred)** | Budget/expense/ledger modules | High complexity; schema ready but no product MVP detail in docs reviewed |

---

## 18. Explicit Non-Recommendations

| Non-recommendation | Reason |
| --- | --- |
| **Full schema rewrite or microservice extraction** | ADR-0003 modular monolith; current slice pattern works |
| **Rich DDD aggregate classes everywhere** | Would fight established anemic interface + use case pattern |
| **Implement all 40+ Prisma models at once** | No product requirements in docs for most domains |
| **LLM-side permission enforcement** | Context Engine doc explicitly forbids; platform must enforce |
| **Organizational Memory in PostgreSQL JSON blobs without spec** | Placeholder doc only — storage shape undefined |
| **Replacing Prisma with alternate ORM** | AGENTS.md: Prisma is source of truth |
| **Client-supplied `organizationId` in mutations** | Violates request-context architecture |
| **Embedding Task under Project skipping Milestone** | Product doc: tasks belong to milestones |
| **Immediate row-level security** | Application scoping works today; RLS is future per schema comment |

---

## 19. Open Questions

1. **Should `Milestone.programId` remain nullable in Prisma** when application enforces project scope only? (*Schema vs domain authority*)
2. **Is the single init migration intentional for all environments**, or should fresh installs split migrations by bounded context going forward?
3. **What is the intended use of `programId` on `DomainEvent`, `AuditEvent`, `ApiKey`, and `AiRun`?** Columns exist but are unused in current use cases.
4. **Organizational Memory:** curated entries, derived summaries, or document embeddings? Doc is placeholder-only.
5. **When should `@synaptria/database/db` be inaccessible from `apps/web`?** Is direct membership query acceptable long-term?
6. **`feature/tasks` merge strategy:** adapt domain to Prisma Milestone fields, or migrate Prisma toward domain shapes?
7. **Task entity:** confirm required fields (assignee, dependencies, due date) for MVP — product doc is one sentence.
8. **Team / TeamMember:** are these planned for authorization, or deferred?
9. **Event delivery:** outbox + worker vs synchronous handlers — not specified in architecture placeholders.
10. **Should Context Engine live in `@synaptria/ai` or a separate `@synaptria/context` package?** Layers doc lists AI package for “retrieval orchestration” but Context Engine doc says it is not the LLM layer.

---

## Summary Tables

### A. Domain concept inventory

| Concept | Current location | Status | Evidence | Recommended action |
| --- | --- | --- | --- | --- |
| Organization | `@synaptria/domain/organization` | Implemented | Domain + app + DB + UI | Maintain; add member admin |
| Membership | `@synaptria/domain/organization` | Partial | Repo + create org; no invite flows | Add use cases |
| Program | `@synaptria/domain/programs` | Implemented | Full vertical slice | Maintain; add update/delete phase |
| Project | `@synaptria/domain/projects` | Implemented | Full vertical slice | Maintain; add update/delete phase |
| Milestone | Prisma only (inspected branch) | Schema only | `schema.prisma`; no domain export | Merge `feature/tasks` reconciled to Prisma |
| Task | Absent (inspected branch) | Missing | No Prisma model; product doc exists | Merge `feature/tasks` migration + domain |
| Deliverable | Prisma only | Not started | Schema | Defer until milestone MVP stable |
| Dependency | Prisma only | Not started | Schema | Defer |
| Risk / Decision | Prisma only | Not started | Schema | Defer until execution MVP |
| Vendor | Prisma + app stub | Not started | Stub `vendorsModule` | Phase 5 vendor MVP |
| Document | Prisma + app stub | Not started | Stub | Phase 6 |
| Finance / Ledger | Prisma + app stub | Not started | Stub | Phase 7+ |
| AiRun | Prisma only | Not started | Schema | Wire when AI module starts |
| DomainEvent | `@synaptria/events` + Prisma | Partial | Write path only | Add consumer/dispatcher |
| AuditEvent | `@synaptria/audit` + Prisma | Partial | Write path only | Add read queries + UI |
| Context Package | Architecture doc | Not started | context-engine.md | New package Phase 3 |
| Organizational Memory | Placeholder doc | Not started | organizational-memory.md | Await product spec |
| User (auth) | Prisma / Auth.js | Implemented (infra) | Not in domain | Keep infra-side unless profile features needed |
| Team | Prisma only | Not started | Schema | Clarify intent |

### B. Prisma-to-domain mapping

| Prisma model | Domain concept | Aggregate | Tenant-owned | Concerns |
| --- | --- | --- | --- | --- |
| Organization | Organization | Organization | N/A (root) | Mapped |
| Membership | OrganizationMembership | Organization | Yes | Mapped |
| User | — (auth) | — | No | Intentionally outside domain |
| Program | Program | Program | Yes | Mapped |
| Project | Project | Project | Yes | Mapped |
| Milestone | — (inspected) / Milestone (*feature/tasks*) | Milestone | Yes | Schema–code gap; enum mismatch on branch |
| Task | — / Task (*feature/tasks*) | Task | Yes | Not in schema on inspected branch |
| Deliverable | — | Milestone/Project | Yes | Unmapped |
| Dependency | — | Project | Yes | Unmapped |
| Risk | — | Project/Program | Yes | Unmapped |
| Decision | — | Project/Program | Yes | Unmapped |
| Vendor + procurement set | — | Vendor | Yes | Unmapped |
| Document + AIExtraction | — | Document | Yes | Unmapped |
| ExecutiveReport | — | Report | Yes | Unmapped |
| Budget* / Expense* / Ledger* | — | Finance | Yes | Unmapped |
| AuditEvent | AuditEventRecord | — | Yes | Write-only mapping |
| DomainEvent | DomainEventEnvelope | — | Yes | Metadata leakage for some fields |
| IdempotencyKey | EventIdempotencyClaim | — | Yes | Not wired |
| ApiKey | — | — | Yes | Unmapped |
| AiRun | — | — | Yes | Unmapped |
| Team / TeamMember | — | — | Partial | No organizationId on TeamMember |

### C. Architecture gap matrix

| Architecture capability | Current support | Gap | Priority | Dependency |
| --- | --- | --- | --- | --- |
| Tenant request context | Implemented | Delivery uses direct Prisma for memberships | Medium | — |
| RBAC permissions | Implemented | No milestone/task permissions on inspected branch | High | Execution MVP |
| Audit logging | Write-only | No read/reporting | Medium | — |
| Domain events | Persist only | No dispatcher/consumers | High | AI Observe stage |
| Event idempotency | In-memory | No Prisma store | Medium | Event dispatcher |
| Context Engine | Documented | No implementation | High | Events + read models |
| Organizational Memory | Named only | No storage/API | Low | Context Engine spec |
| Reasoning Layer | Placeholder doc | None | Medium | Context Engine |
| Recommendation Engine | Placeholder doc | None | Medium | Reasoning Layer |
| Provider Platform | Placeholder doc | None | Medium | AiRun traceability |
| AI Operating Loop | Philosophy doc | No end-to-end path | High | All AI components |
| Background jobs | Mentioned in system doc | None | Medium | Event dispatcher |
| Document storage (S3) | Mentioned | None | Medium | Documents module |
| Execution hierarchy UI | Projects only | Milestones/tasks on feature branch | High | Merge feature/tasks |
| Finance / vendors / documents | Schema only | Full domain gap | Low | Product MVP specs |

### D. Recommended implementation phases

| Phase | Scope | Deliverables | Dependencies | Risk |
| --- | --- | --- | --- | --- |
| 0 | Documentation alignment | Updated schema.md, merged AI docs, deduped architecture paths | — | Low |
| 1 | Execution MVP | Milestone + Task domain/repos/app/UI; permissions; Task migration | Reconcile feature/tasks with Prisma | **High** if enums diverge |
| 2 | Event pipeline | PENDING event processor, handler registry, idempotency adapter | Phase 1 events stable | Medium |
| 3 | Context Engine v0 | Context Package builder, permission-filtered reads | Phase 1–2 | Medium |
| 4 | Governance | Audit query API, membership invite/manage | Permissions patterns | Low |
| 5 | Vendors MVP | Vendor domain slice + UI | Phase 0 docs | Medium |
| 6 | Documents + AI trace | Document metadata, AiRun on jobs | S3 adapter, Phase 3 | Medium |
| 7 | Finance | Budget/expense selective MVP | Product definition | **High** complexity |

---

## Appendix: Files inspected

### Architecture & product documentation

- `docs/03-product/ai-philosophy.md` — via `git show docs/ai-operating-system:...`
- `docs/01-architecture/overview.md`, `context-engine.md`, `organizational-memory.md`, `reasoning-layer.md`, `recommendation-engine.md`, `event-system.md`, `provider-platform.md` — via git show (placeholders except context-engine + ai-philosophy)
- `docs/01-architecture/domain-layer.md`, `request-context.md`, `authorization.md`, `system-architecture.md`, `ai-architecture.md`, `backend.md`
- `docs/architecture/layers.md`, `system.md`, `coding-standards.md`
- `docs/02-database/schema.md`, `erd.md`, `naming-conventions.md`, `migrations.md`
- `docs/03-product/organizations.md`, `programs.md`, `projects.md`, `tasks.md`, `documents.md`, `vendors.md`, `reporting.md`, `ai.md`
- `docs/modules/projects-implementation-plan.md`, `programs-implementation-plan.md`
- `docs/ADR/0003-modular-monolith.md`, `docs/README.md`, `AGENTS.md`

### Prisma & migrations

- `packages/database/prisma/schema.prisma`
- `packages/database/prisma/migrations/20260725015903_init/migration.sql`

### Domain

- `packages/domain/src/index.ts`
- `packages/domain/src/organization/*`
- `packages/domain/src/programs/*`
- `packages/domain/src/projects/*`

### Application

- `packages/application/src/index.ts`
- `packages/application/src/modules/organization/*`
- `packages/application/src/modules/programs/*`
- `packages/application/src/modules/projects/*`
- `packages/application/src/modules/{ai,dashboard,documents,finance,reporting,vendors}/index.ts`

### Database / persistence

- `packages/database/src/index.ts`, `transaction.ts`, `prisma-errors.ts`, `json.ts`
- `packages/database/src/organization/*`, `programs/*`, `projects/*`, `audit/*`, `events/*`

### Cross-cutting

- `packages/core/src/context/*`, `ids/*`, `errors/*`
- `packages/auth/src/organization-context.ts`
- `packages/permissions/src/*`
- `packages/audit/src/*`
- `packages/events/src/*`
- `packages/ai/README.md`

### Delivery

- `apps/web/lib/request-context.ts`, `program-service.ts`, `project-service.ts`
- `apps/web/app/actions/{organization,programs,projects}/*`
- `apps/web/app/{programs,projects,dashboard}/*` (filesystem listing)

### Tests (sampled)

- Repository tests: `packages/database/src/programs/prisma-program-repository.test.ts`, `projects/`, `audit/`, `events/`
- Application tests: `packages/application/src/modules/{organization,programs,projects}/*.test.ts`
- Web tests: `apps/web/app/actions/programs/create-program-form.test.ts`, `projects/create-project-form.test.ts`

### Branch comparison

- `git diff docs/domain-model-assessment feature/tasks` (stat)
- `git show feature/tasks:packages/domain/src/milestones/models.ts`
- `git show feature/tasks:packages/domain/src/tasks/models.ts`
