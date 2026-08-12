# Domain Model Assessment

**Status:** Assessment (read-only review)  
**Branch inspected:** `docs/domain-model-assessment` @ `ec69e8b` (working tree includes restored AI architecture docs)  
**Date:** 2026-08-12  
**Scope:** Architecture-to-domain-model alignment at current working tree. No code, schema, migration, test, or other documentation changes were made.

---

## 1. Executive Summary

Synaptria implements a **complete execution vertical slice**: **Organization → Program → Project → Milestone → Task**, spanning domain contracts, application use cases, Prisma adapters, permissions, audit/events on writes, web composition roots, server actions, routes, and UI.

The **Prisma schema** still describes a broader **target platform** (finance, vendors, documents, ledger, AI traceability, platform governance) with most models **unimplemented** in domain/application code. Three migrations are applied: init (`20260725015903_init`), Milestone alignment (`20260725220000_align_milestone_domain_model`), and Task creation (`20260726200000_add_task_model`).

**AI architecture documentation** under `docs/01-architecture/` and `docs/03-product/` is now **substantive** for the operating-system map and all major subsystems. Classification:

| Subsystem | Doc status | Code status |
| --- | --- | --- |
| AI Operating System Overview | **Proposed** (`docs/01-architecture/overview.md`) | Unimplemented |
| AI Philosophy | **Proposed** (`docs/03-product/ai-philosophy.md`) | Unimplemented |
| Context Engine | **Accepted** (`docs/01-architecture/context-engine.md`) | **Unimplemented** |
| Organizational Memory | **Proposed** (`docs/01-architecture/organizational-memory.md`) | **Unimplemented** — conceptual model documented |
| Reasoning Layer | **Proposed** (`docs/01-architecture/reasoning-layer.md`) | **Unimplemented** — architecturally defined |
| Recommendation Engine | **Proposed** (`docs/01-architecture/recommendation-engine.md`) | **Unimplemented** — architecturally defined |
| Event System | **Proposed** (`docs/01-architecture/event-system.md`) | **Partially implemented** (persist + publish; no consumer) |
| Provider Platform | **Proposed** (`docs/01-architecture/provider-platform.md`) | **Unimplemented** — architecturally defined |

**Source-of-truth model (confirmed):** Business semantics in `@synaptria/domain`; persistence in Prisma (aligned via migrations); use-case contracts in `@synaptria/application`. Domain leads semantic changes; Prisma follows.

**Highest-risk remaining gaps:**

1. **Large dormant Prisma surface** — 35+ models without domain/application implementations.
2. **Context Engine unimplemented** — Accepted spec with no contracts or assembler (`docs/01-architecture/overview.md` and Context Engine doc agree first delivery is deterministic context contracts).
3. **Event consumption and broader reads missing** — persistence and publish-in-transaction exist; no dispatcher, no organization/time-window queries (`docs/01-architecture/event-system.md` § Current-State Implications).
4. **Replay/idempotency strategy deferred** — interfaces exist; producer/consumer idempotency not wired (`packages/events/src/idempotency.ts`; Prisma `IdempotencyKey` unused).
5. **Obsolete operational docs** — `docs/02-database/schema.md` and `docs/01-architecture/layers.md` module table understate shipped execution slice.

**Recommended first phase (unchanged):** Provider-independent, deterministic **Context Engine contracts** and read-only assembly — **no LLM**, **no new persistence** unless justified.

---

## 2. Current Domain Architecture

### 2.1 Layering (implemented production architecture)

Confirmed in `docs/01-architecture/layers.md` and implemented consistently:

```text
apps/web (delivery: pages, server actions, composition roots)
  → @synaptria/application (use cases, services, unit of work)
    → @synaptria/domain (models, validation, repository ports)
      ← @synaptria/database (Prisma adapters, transactions)
```

Cross-cutting packages in active use: `@synaptria/core`, `@synaptria/auth`, `@synaptria/permissions`, `@synaptria/audit`, `@synaptria/events`.

**Write-path pattern (confirmed)** for Organization, Program, Project, Milestone, Task:

1. `requirePermission` with role from trusted context  
2. Domain normalization/validation (Tasks use `packages/domain/src/tasks/validation.ts`)  
3. Parent-entity existence checks inside transaction  
4. Repository create via module unit of work  
5. `AuditService.record`  
6. `DomainEventService.publish`  
7. Branded IDs at persistence boundary via `identifier()`  

Evidence: `packages/application/src/modules/{programs,projects,milestones,tasks}/create-*.ts`.

### 2.2 Source-of-truth model

| Concern | Owner | Evidence |
| --- | --- | --- |
| **Business semantics** | `@synaptria/domain` | `packages/domain/src/milestones/models.ts`, `tasks/models.ts`, `tasks/validation.ts`; migration `20260725220000_align_milestone_domain_model/migration.sql` |
| **Persistence representation** | Prisma + migrations | `packages/database/prisma/schema.prisma`; mappers in `packages/database/src/*/prisma-*-repository.ts` |
| **Use-case semantics** | `@synaptria/application` | `Create*Context`, `Create*Input`, use case classes |
| **Delivery binding** | `apps/web` | `createTaskAction(expectedMilestoneId, …)` in `apps/web/app/actions/tasks/create-task.ts` |
| **AI subsystem contracts** (when implemented) | Domain + application per `docs/01-architecture/overview.md` Layer Boundaries | Domain: memory/recommendation concepts; Application: context, reasoning, recommendations |

**Conclusion:** Deliberate split — domain-led semantics; Prisma persistence truth after alignment. AI architecture docs assign stable contracts to domain/application and adapters to infrastructure (`docs/01-architecture/overview.md`).

### 2.3 Domain style

- **Confirmed:** TypeScript interfaces; repository ports; no framework imports in domain.
- **Confirmed:** Task validation in domain; Milestone validation primarily in application (*variance*).
- **Confirmed:** Shared `Priority` in `packages/domain/src/shared/priority.ts`.
- **Inference:** Program, Project, Milestone, Task are logical aggregate roots for audit/events.

---

## 3. Existing Bounded Contexts

| Bounded context | Implementation status | Architecture doc status | Evidence |
| --- | --- | --- | --- |
| **Identity & tenant** | Partial | Operational system (overview) | `packages/domain/src/organization/`, `apps/web/lib/request-context.ts` |
| **Execution / portfolio** | **Implemented MVP** | Operational system | Org → Task full slice |
| **Finance / vendors / documents / reporting** | Schema only | Operational systems (future) | Prisma + application stubs |
| **Platform governance** | Partial (audit/event writes) | Event System + audit | `@synaptria/audit`, `@synaptria/events` |
| **AI execution trace** | Schema only (`AiRun`) | Provider Platform telemetry | Prisma; `@synaptria/ai` README only |
| **Context Engine** | Unimplemented | **Accepted** | `docs/01-architecture/context-engine.md` |
| **Organizational Memory** | Unimplemented | **Proposed** (fully specified conceptually) | `docs/01-architecture/organizational-memory.md` |
| **Reasoning / Recommendation** | Unimplemented | **Proposed** (defined) | `reasoning-layer.md`, `recommendation-engine.md` |
| **Event System (proactive bus)** | **Partial** | **Proposed** (defined; acknowledges current gaps) | `event-system.md`; code in `@synaptria/events` |
| **Provider Platform** | Unimplemented | **Proposed** (defined) | `provider-platform.md` |

---

## 4. Existing Entities

### 4.1 Implemented end-to-end (confirmed)

| Entity | Domain | Application | Persistence | Web |
| --- | --- | --- | --- | --- |
| Organization | ✓ | ✓ | ✓ | ✓ |
| OrganizationMembership | ✓ | partial | ✓ | via context |
| Program | ✓ | ✓ | ✓ | ✓ |
| Project | ✓ | ✓ | ✓ | ✓ |
| Milestone | ✓ | ✓ | ✓ | ✓ |
| Task | ✓ | ✓ | ✓ | ✓ |

**Domain exports:** `packages/domain/src/index.ts` — `organization`, `programs`, `projects`, `milestones`, `tasks`, `shared`.

**Web routes:** `/programs`, `/projects`, `/projects/[projectId]/milestones`, `…/tasks`, `…/tasks/new`, `…/tasks/[taskId]`.

**Composition roots:** `apps/web/lib/{organization,program,project,milestone,task}-service.ts`.

### 4.2 Prisma-only entities (confirmed)

~35 remaining models in `packages/database/prisma/schema.prisma`.

### 4.3 Auth entities (confirmed)

`User`, `Account`, `Session`, `VerificationToken` — infrastructure only.

---

## 5. Existing Aggregates and Aggregate Roots

**Inferred** from audit targets and domain events:

| Aggregate root | Events (writes) |
| --- | --- |
| Organization | `organization.created` |
| Program | `program.created` |
| Project | `project.created` |
| Milestone | `milestone.created` |
| Task | `task.created` |

**Execution hierarchy (confirmed, aligned):** `Program → Project → Milestone → Task` — required FKs in Prisma; migration `20260725220000_align_milestone_domain_model`.

---

## 6. Existing Value Objects

| Concept | Location | Status |
| --- | --- | --- |
| Branded IDs | `@synaptria/core` | Implemented |
| `RequestId`, `CorrelationId` | `@synaptria/core` | Implemented |
| `Priority` | `packages/domain/src/shared/priority.ts` | Implemented (partial adoption) |
| Status enums | Domain modules | Match Prisma at HEAD |
| Date-range validation | Domain (Task), application (Milestone) | Partially centralized |

---

## 7. Repository and Persistence Boundaries

### 7.1 Repository ports and adapters

| Port | Domain | Prisma adapter |
| --- | --- | --- |
| Organization, Membership, Program, Project, Milestone, Task | `packages/domain/src/*/` | `packages/database/src/*/prisma-*-repository.ts` |
| Audit, Event | `@synaptria/audit`, `@synaptria/events` | `prisma-audit-repository.ts`, `prisma-event-repository.ts` |

### 7.2 Transaction boundaries

`packages/database/src/transaction.ts` — entity + audit + event in one transaction for creates. **Confirmed** in all six create use cases.

### 7.3 Event and audit architecture (code vs `docs/01-architecture/event-system.md`)

| Capability | Status | Evidence |
| --- | --- | --- |
| **Event persistence** | **Implemented** | `PrismaEventRepository.append` — `packages/database/src/events/prisma-event-repository.ts` |
| **Event publishing (producer path)** | **Implemented** | `DomainEventService.publish` inside create use cases — e.g. `packages/application/src/modules/tasks/create-task.ts` |
| **Transactional consistency (write + event)** | **Implemented** | Same DB transaction via unit of work — matches event-system doc preference |
| **Event consumption / dispatcher** | **Not implemented** | No worker, handler registry, or `updateStatus` transitions from app code |
| **Aggregate-scoped event query** | **Implemented** | `EventRepository.findByAggregate` — `packages/events/src/repository.ts` |
| **Organization / time-window event queries** | **Not implemented** | No `findByOrganization`, `since`, or `listPending` on `EventRepository`; grep confirms absence in `packages/` |
| **Producer idempotency** | **Deferred** | `EventIdempotencyStore` + `InMemoryEventIdempotencyStore` — `packages/events/src/idempotency.ts`; not injected in use cases; no `idempotencyKey` in application layer |
| **Consumer idempotency** | **Deferred** | Documented requirement in `event-system.md`; no consumer exists |
| **Replay** | **Deferred** | Storage supports future replay; no replay tooling or processor |
| **First-class event identity fields** | **Partial** | `correlationId` column; `actorId`, `requestId`, `idempotencyKey` in metadata bucket — `INTERNAL_METADATA_KEY` in `prisma-event-repository.ts` |
| **Audit persistence** | **Implemented (write)** | `PrismaAuditRepository.create` |
| **Audit read** | **Not implemented** | No query methods on `AuditRepository` |

**Distinction (confirmed):** `@synaptria/events` implements **domain event persistence and producer-side publish-in-transaction**. The **Event System architecture** additionally requires consumers, broader reads, explicit idempotency/replay — **not yet built**. Event System doc explicitly states this at § Current-State Implications.

**Distinction (documented):** Event System records operational history; Organizational Memory preserves curated knowledge (`event-system.md` Core Distinction; `organizational-memory.md` Operational History vs Organizational Memory).

---

## 8. Prisma Model Inventory

Schema: `packages/database/prisma/schema.prisma`  
Migrations: three through `20260726200000_add_task_model`

Execution entities **aligned** at HEAD — Milestone and Task match domain enums and FKs. No historical mismatch remains.

---

## 9. Tenant and Authorization Boundaries

### 9.1 Tenant resolution (implemented)

`apps/web/lib/request-context.ts` — matches `docs/01-architecture/request-context.md`.

### 9.2 `request-context.ts` Prisma access

**Classification: intentional infrastructure composition at the delivery-layer composition root.**

Evidence: `docs/01-architecture/layers.md` dependency matrix allows web → database; parallel pattern in `apps/web/lib/*-service.ts`. Application layer does not import `@synaptria/database`. **Not a boundary violation.**

### 9.3 Permissions (implemented)

`MILESTONES_*`, `TASKS_*` in `packages/permissions/src/permissions.ts`; role mappings in `roles.ts`.

Organizational Memory doc defines visibility (Personal, Team, Department, Organization, Shared) and least-privilege retrieval (`organizational-memory.md` § Permissions and Tenant Isolation) — **documented, not implemented in code**.

---

## 10. Architectural Concepts Already Implemented

| Concept | Evidence |
| --- | --- |
| Modular monolith | `docs/ADR/0003-modular-monolith.md`, `docs/01-architecture/layers.md` |
| Execution hierarchy Org → Task | Domain through UI |
| Repository ports + Prisma adapters | Domain + database packages |
| RBAC including milestones/tasks | `@synaptria/permissions` |
| Audit on creates | Six create use cases |
| Domain event persist + publish on creates | `*.created` events via `DomainEventService` |
| Aggregate event query port | `EventRepository.findByAggregate` |
| Transactional write + audit + event | Unit of work pattern |
| Route-integrity for Task create | `apps/web/app/actions/tasks/create-task.ts` |
| Task domain validation | `packages/domain/src/tasks/validation.ts` |
| AI architecture documentation (substantive) | `docs/01-architecture/{overview,context-engine,organizational-memory,reasoning-layer,recommendation-engine,event-system,provider-platform}.md` |

---

## 11. Architectural Concepts Partially Implemented

| Concept | Current state | Gap |
| --- | --- | --- |
| **Product domain coverage** | 6 entities E2E | ~35 Prisma models without domain |
| **Event System** | Persist + publish in transaction; aggregate query | Consumer, org/time-window reads, dispatcher, idempotency wiring, replay (`event-system.md`) |
| **Audit** | Write path | Read/query path |
| **Application stubs** | finance, vendors, documents, ai, etc. | Module constants only |
| **Context Engine** | Accepted spec | No contracts or assembler |
| **Organizational Memory** | Proposed spec (concept complete) | No domain types, services, or persistence |
| **Reasoning Layer** | Proposed spec | No `ReasoningResult` contracts or services |
| **Recommendation Engine** | Proposed spec | No recommendation contracts or services |
| **Provider Platform** | Proposed spec | `@synaptria/ai` placeholder only |
| **Documentation accuracy** | AI arch docs current | `docs/02-database/schema.md`, `layers.md` module table stale |

### 11.1 AI subsystem classification (doc vs code)

| Subsystem | Documentation | Implementation |
| --- | --- | --- |
| **AI OS Overview** | **Proposed** — map and delivery sequence | **Unimplemented** |
| **AI Philosophy** | **Proposed** — principles | **Unimplemented** (no runtime) |
| **Context Engine** | **Accepted** | **Unimplemented** |
| **Organizational Memory** | **Proposed** — full conceptual architecture | **Unimplemented** (persistence/storage TBD) |
| **Reasoning Layer** | **Proposed** — defined inputs/outputs/pipeline | **Unimplemented** |
| **Recommendation Engine** | **Proposed** — defined lifecycle/contracts | **Unimplemented** |
| **Event System** | **Proposed** — target architecture | **Partially implemented** (see §7.3) |
| **Provider Platform** | **Proposed** — defined contracts/routing | **Unimplemented** |
| **Workflow Execution** | Referenced in overview | **Deferred** (not in scope of this assessment) |

### 11.2 Concept placement for initial implementation (no unjustified persistence)

| Concept | Initial form | Persistence |
| --- | --- | --- |
| **Context Package** | Domain/application **immutable DTO** | **Ephemeral/derived** — serializable for trace; not a Prisma table (`context-engine.md`) |
| **Context Engine** | **Application service** — deterministic reads | None dedicated |
| **Organizational Memory** | **Typed domain contracts** + retrieval port; lifecycle per doc | **Deferred** — doc: contracts independent of storage; shape when first durable capability ships (`organizational-memory.md` § Typed Memory Contracts) |
| **Recent Events (in context)** | **Derived** via `EventRepository.findByAggregate` (v0); org/time-window later | Reuses `DomainEvent` table |
| **Reasoning Result** | **Application/domain contract** | Ephemeral unless audit/eval requires retention |
| **Recommendation** | **Application/domain contract** | **Deferred** — doc: justify storage when first durable recommendation capability ships (`recommendation-engine.md` § Persistence) |
| **Provider request/response** | **Infrastructure contracts** in `@synaptria/ai` | **Optional durable** via existing `AiRun` when jobs run |
| **Candidate Memory** | Application/domain type in memory lifecycle | **Deferred** with Organizational Memory persistence |

---

## 12. Missing Architectural Concepts (code only)

Architecture is **documented** for items below; **code is missing**:

| Concept | Doc | Code |
| --- | --- | --- |
| Context Engine assembler | Accepted | None |
| Organizational Memory types, validation, curation services | Proposed | None |
| Reasoning Layer pipeline | Proposed | None |
| Recommendation Engine | Proposed | None |
| Event dispatcher / consumers | Proposed | None |
| Provider adapters / router | Proposed | None |
| Background job / outbox worker | system-architecture.md | None |
| S3 document storage | system-architecture.md | None |
| Audit query UI/API | — | None |
| Update/delete execution use cases | — | Not present (*inference*) |

---

## 13. Persistence Leakage or Boundary Violations

| Issue | Classification | Evidence |
| --- | --- | --- |
| Event identity fields in JSON metadata | Accepted adapter workaround | `packages/database/src/events/prisma-event-repository.ts` |
| Large dormant schema | Target schema pattern | Init migration |
| Unused `programId` on platform models | Unresolved schema intent | `DomainEvent`, `AuditEvent`, etc. |
| Delivery `db` at composition root | Documented pattern | `layers.md` web → database |

---

## 14. Naming and Terminology Inconsistencies

| Area | Issue | Locations |
| --- | --- | --- |
| Priority type aliases | Duplicate names, same values | Domain modules vs `shared/priority.ts` |
| Obsolete schema doc | Milestone/Task listed as “Future” | `docs/02-database/schema.md` |
| Stale layers module table | Lists only `organization` | `docs/01-architecture/layers.md` |
| `AIJob` vs `AiRun` | Naming drift | `docs/02-database/schema.md` vs Prisma |
| Doc status labels | Context Engine **Accepted**; other AI subsystems **Proposed** | Respective architecture files |

**Removed:** Claims that overview, reasoning, recommendation, event-system, provider-platform, or organizational-memory docs are placeholders.

---

## 15. Risks

| Risk | Impact | Notes |
| --- | --- | --- |
| Dormant Prisma models invite ad hoc `db` usage | High | Lint/guard composition roots |
| Context Engine skipped in favor of LLM features | High | Overview and Context Engine doc forbid this |
| Event consumer delay blocks Observe and Mission Control | High | `event-system.md` + overview delivery sequence |
| Conflating DomainEvent history with Organizational Memory | Medium | Both docs forbid; enforce in implementation |
| Event metadata nesting limits query/replay | Medium | `event-system.md` calls for first-class identity fields “where justified” |
| Obsolete `schema.md` / `layers.md` | Medium | Misleads contributors |
| Organizational Memory persistence designed before contracts | Medium | Doc requires typed contracts first |

---

## 16. Recommended Domain Model

Preserve **Program → Project → Milestone → Task** and existing repository/use-case pattern.

### 16.1 Minimum domain contracts for first Context Engine (deterministic v0)

Aligned with `docs/01-architecture/overview.md` Initial Delivery Sequence and Context Engine doc:

| Contract | Purpose | Reuse today |
| --- | --- | --- |
| `ContextRequest` | Capability id, primary entity ref, objective | **New** |
| `ContextPackage` | Immutable sections: Request, Identity, Authorization, Primary Entity, Related Entities, Events, Provenance, Metadata (`context-engine.md`) | **New** DTO — no Prisma |
| `ContextEntityRef` | Typed entity pointer | **New** |
| `ProvenanceRecord` | Source, retrievedAt, permission scope | **New** |
| Read ports | Authorized entity graph | **Reuse** — Program/Project/Milestone/Task repositories |
| `EventRepository.findByAggregate` | Recent events for primary/related aggregates | **Reuse** |
| Permissions / `RequestContext` | Authorization section | **Reuse** |
| `OrganizationalMemoryProvider` | Curated retrieval port | **New port + no-op impl** — returns empty until memory persistence exists; **must not** substitute raw events |
| `AuditRepository` reads | Supporting evidence | **Gap** — add read port or methods |

**Inference:** v0 assembler for `Project` or `Milestone` with empty Organizational Memory section degrades gracefully per `organizational-memory.md` § Integration with the Context Engine.

### 16.2 Organizational Memory

**Documented (Proposed architecture — not placeholder):**

- **Conceptual model:** typed Memory with Identity, Type, Content, Confidence, Provenance, Evidence, Relationships, Access Context, Lifecycle, Metadata (`organizational-memory.md` § Typed Memory Contracts)
- **Lifecycle:** Operational Event → Candidate Memory → Validation → Curation → Published Memory → Active Retrieval → Review → Updated/Superseded/Archived/Retired
- **Validation & curation:** evidence, duplication, confidence, permission scope; human review for high-impact types
- **Retrieval & ranking:** context-driven, composite relevance, retrieval budget, progressive/explainable
- **Provenance & permissions:** full provenance chain; visibility levels; least privilege; tenant isolation
- **Retention:** operational forgetting vs archival/retirement with provenance preserved
- **Context Engine integration:** specialized Context Provider; operational context assembled first; graceful degradation when memory unavailable

**Open (implementation only):** concrete **persistence/storage design** — doc explicitly defers storage shape until first durable capability (`organizational-memory.md`: contracts independent of storage; `recommendation-engine.md` similar for recommendations).

**Explicit:** Organizational Memory is **not** raw event history, generic embeddings, or unfiltered summaries.

### 16.3 Downstream execution entities

Defer Deliverable, Dependency, Risk, Decision until product MVP defined.

---

## 17. Recommended Implementation Sequence

Per `docs/01-architecture/overview.md` Initial Delivery Sequence — **deterministic first, no LLM, no embeddings, no autonomous writes**:

| Phase | Scope | Deliverables |
| --- | --- | --- |
| **0** | Doc hygiene | Fix `docs/02-database/schema.md`, `docs/01-architecture/layers.md` module table |
| **1** | **Context contracts (no LLM)** | `ContextRequest`, `ContextPackage`, provenance types, `OrganizationalMemoryProvider` stub; unit tests |
| **2** | **Deterministic Context Engine v0** | Read-only assembler for Project/Milestone; permission-aware; aggregate events only |
| **3** | **Event read extensions + dispatcher** | Org/time-window queries per `event-system.md`; PENDING processor; handler registry |
| **4** | **Idempotency + replay foundations** | Wire producer idempotency; consumer dedup; status transitions |
| **5** | **Audit read + membership admin** | Query use cases |
| **6** | **Organizational Memory contracts** | Domain memory types + lifecycle enums; still **no persistence** until curation MVP scoped |
| **7** | **Organizational Memory persistence** | Storage **only when** first curation/publication workflow is specified |
| **8** | **Provider Platform skeleton** | Provider-agnostic contracts, one adapter — **after** Context Engine (`provider-platform.md` § Initial Implementation) |
| **9** | **Reasoning Layer** | `ReasoningResult` contract + deterministic capabilities first |
| **10** | **Recommendation Engine** | Contracts; durable storage when first review-state capability needs it |
| **11+** | Finance, vendors, documents | Product MVP specs |

---

## 18. Explicit Non-Recommendations

| Non-recommendation | Reason |
| --- | --- |
| Prisma tables for Context Package, Context Engine, Reasoning Layer, provider abstractions | Architecture assigns these to contracts/services (`overview.md`, `context-engine.md`) |
| Prisma tables for Organizational Memory **before** typed contracts and curation workflow | `organizational-memory.md` § Typed Memory Contracts |
| Using `DomainEvent` rows as Organizational Memory | Both event-system and organizational-memory docs forbid |
| Generic embedding store as Organizational Memory | Not curated/validated knowledge |
| LLM / provider SDK before Context assembler | `overview.md` § Current Implementation Boundary |
| Chatbot-first delivery | Explicit non-goal in overview |

---

## 19. Open Questions

1. When to add `AuditRepository` query methods vs a dedicated read model for context/history?
2. Should event `actorId`/`requestId`/`idempotencyKey` migrate to first-class columns (`event-system.md` § Current-State Implications)?
3. When to wire Prisma `IdempotencyKey` to `DomainEventService` — at dispatcher introduction or earlier?
4. What is optional `programId` on `DomainEvent`, `AuditEvent`, `ApiKey`, `AiRun` for?
5. **Organizational Memory persistence shape** — relational vs document vs hybrid (*conceptual architecture defined; storage design open*)?
6. Centralize Milestone validation in domain like Task?
7. Update/delete/soft-delete use cases — timeline for execution entities?

**Removed (answered by restored architecture docs):**

- ~~Organizational Memory curation workflow unknown~~ — defined in `organizational-memory.md` § Memory Lifecycle, Validation and Curation  
- ~~Organizational Memory governance/retrieval undefined~~ — defined in permissions, retention, ranking sections  
- ~~Event System vs `@synaptria/events` relationship unclear~~ — `event-system.md` § Current-State Implications acknowledges existing persistence and lists gaps  
- ~~Reasoning/Recommendation/Provider/Event architecture absent~~ — substantive docs now present  

---

## 20. Changes Since Initial Assessment

Baselines: (1) first assessment @ `c0b5c86` (2026-07-29); (2) second revision @ `ec69e8b` (2026-08-04).

### Findings removed (this revision)

| Removed finding | Reason |
| --- | --- |
| Organizational Memory is “placeholder doc only” | **Substantive** `docs/01-architecture/organizational-memory.md` (Proposed v0.1) |
| OM curation workflow / lifecycle / governance undefined | **Documented** — lifecycle, validation, curation, retrieval, ranking, permissions, retention |
| Overview, Reasoning, Recommendation, Event System, Provider Platform “placeholder headers only” | **Restored to substantive Proposed architecture docs** |
| Phase 5 “expand placeholder doc” for Organizational Memory | Doc expansion **done**; phase reframed to contracts then persistence |
| Open question: Event System doc vs `@synaptria/events` | **Answered** in `event-system.md` § Current-State Implications |
| Open question: OM approval workflow undefined | **Answered** in organizational-memory lifecycle and validation sections |
| Placeholder vs Accepted row in naming table for AI docs | Replaced with accurate Proposed/Accepted labels |

### Findings revised (this revision)

| Topic | Prior (second revision) | Current |
| --- | --- | --- |
| AI subsystem docs | Context Engine Accepted; others placeholders | **All major subsystems architecturally defined**; Context Engine **Accepted**; others **Proposed** |
| Organizational Memory status | “Principles only” / placeholder | **Proposed architecture complete**; code **unimplemented**; persistence **open** |
| Event System | “Domain event table only” | **Partially implemented**: persist, publish-in-transaction, aggregate query; gaps per event-system doc |
| Reasoning / Recommendation / Provider | “Placeholder docs” | **Proposed, architecturally defined, unimplemented** |
| Architecture gap matrix OM row | “Memory doc expansion” | **Contracts + persistence when justified** |
| Implementation Phase 5 | Expand OM doc | **OM domain contracts** (Phase 6–7 persistence) |
| Overview delivery alignment | Not cited | **Confirmed** — overview Initial Delivery Sequence matches Phase 1–2 |

### Findings confirmed

| Finding | Still true |
| --- | --- |
| Execution MVP Org → Task | Yes |
| Context Engine unimplemented | Yes |
| Reasoning / Recommendation / Provider unimplemented | Yes |
| No event consumer | Yes |
| No org/time-window event queries in code | Yes |
| Idempotency/replay deferred | Yes |
| Context contracts as first implementation step | Yes — reinforced by overview.md |
| Dormant Prisma surface | Yes |
| Obsolete `schema.md` / stale `layers.md` table | Yes |

### New findings introduced (this revision)

| Finding | Evidence |
| --- | --- |
| AI OS overview defines layer boundaries and delivery sequence | `docs/01-architecture/overview.md` |
| Event System doc distinguishes operational events from Organizational Memory | `event-system.md` Core Distinction |
| OM integrates as Context Provider with graceful degradation | `organizational-memory.md` § Integration with the Context Engine |
| Provider Platform must follow Context Engine | `provider-platform.md` § Initial Implementation |
| Recommendation persistence deferred until first durable capability | `recommendation-engine.md` § Persistence |
| Reasoning may be deterministic without LLM | `reasoning-layer.md` § Deterministic and Model-Assisted Reasoning |

---

## Summary Tables

### A. Domain concept inventory

| Concept | Current location | Status | Evidence | Recommended action |
| --- | --- | --- | --- | --- |
| Organization … Task | `@synaptria/domain/*` | Implemented | Full slice | Maintain; add update/delete when prioritized |
| Priority (shared) | `domain/shared` | Partial | Task uses | Consolidate aliases |
| DomainEvent (persist/publish) | `@synaptria/events` + Prisma | **Partial** | Write + aggregate query | Dispatcher + broader reads |
| AuditEvent | `@synaptria/audit` + Prisma | Partial | Write only | Read queries |
| Context Package | Architecture | **Accepted doc; no code** | `context-engine.md` | **Phase 1 contracts** |
| Organizational Memory | Architecture | **Proposed doc; no code** | `organizational-memory.md` | Phase 6 contracts; Phase 7 persistence when justified |
| Reasoning Result | Architecture | Proposed doc; no code | `reasoning-layer.md` | After Context Engine + provider skeleton |
| Recommendation | Architecture | Proposed doc; no code | `recommendation-engine.md` | After Reasoning Layer |
| Provider Platform | Architecture | Proposed doc; no code | `provider-platform.md` | After Context Engine |
| Event System (bus) | Architecture + partial code | **Partial** | `event-system.md`; `@synaptria/events` | Consumer + queries + idempotency |
| AiRun | Prisma only | Not started | Schema | On first provider job |

### B. Prisma-to-domain mapping

(Unchanged for execution entities — aligned at HEAD.)

| Prisma model | Domain concept | Aggregate | Tenant-owned | Concerns |
| --- | --- | --- | --- | --- |
| Organization … Task | Mapped | Respective roots | Yes | Aligned |
| DomainEvent | DomainEventEnvelope | — | Yes | Partial impl; metadata nesting |
| IdempotencyKey | — | — | Yes | Unwired |
| AiRun | — | — | Yes | Future provider telemetry |
| ~35 other models | — | — | Yes | Unmapped |

### C. Architecture gap matrix

| Architecture capability | Current support | Gap | Priority | Dependency |
| --- | --- | --- | --- | --- |
| Execution MVP (Program→Task) | **Implemented** | Update/delete | Low | — |
| Context Engine | Accepted doc | Contracts + assembler | **High** | Execution read ports |
| Organizational Memory | **Proposed doc (complete concept)** | Domain types, services, persistence | Medium | Context Engine v0 |
| Reasoning Layer | Proposed doc | Contracts + services | Medium | Context Package |
| Recommendation Engine | Proposed doc | Contracts + services | Medium | Reasoning Layer |
| Provider Platform | Proposed doc | Adapters + router | Medium | Context Engine first |
| Event persistence | **Implemented** | — | — | — |
| Event publishing | **Implemented** | — | — | — |
| Event consumption | Not implemented | Dispatcher, handlers | **High** | — |
| Event org/time-window reads | Not implemented | Repository extensions | **High** | event-system.md |
| Event idempotency / replay | Deferred | Wire store + consumer dedup | Medium | Dispatcher |
| Audit logging | Write-only | Read/reporting | Medium | — |
| AI Operating Loop | Proposed docs | End-to-end runtime | High | Context + events + provider |
| Finance / vendors / documents | Schema only | Domain slices | Low | Product specs |

### D. Recommended implementation phases

| Phase | Scope | Deliverables | Dependencies | Risk |
| --- | --- | --- | --- | --- |
| **0** | Doc hygiene | Fix `schema.md`, `layers.md` | — | Low |
| **1** | **Context contracts** | `ContextRequest`, `ContextPackage`, provenance, memory port stub | Execution repos | Low |
| **2** | **Context assembler v0** | Deterministic Project/Milestone assembly; no LLM | Phase 1 | Medium |
| **3** | Event dispatcher + reads | Consumer, org/time-window queries | — | Medium |
| **4** | Idempotency / replay foundations | Producer + consumer idempotency | Phase 3 | Medium |
| **5** | Governance reads | Audit query, membership admin | — | Low |
| **6** | OM domain contracts | Memory types, lifecycle, provider port | Phase 1 | Low |
| **7** | OM persistence | Storage when curation MVP defined | Phase 6 | Medium |
| **8** | Provider skeleton | Contracts, one adapter, `AiRun` wiring | Phase 2 | Medium |
| **9–10** | Reasoning + Recommendation | Contracts; durable reco storage when needed | Phases 2, 8 | Medium |
| **11+** | Finance/vendors/docs | Domain slices | Product MVP | High |

---

## Appendix: Files inspected (working tree @ `ec69e8b`)

### Architecture documentation (read in full for this revision)

- `docs/01-architecture/overview.md`
- `docs/01-architecture/context-engine.md`
- `docs/01-architecture/organizational-memory.md`
- `docs/01-architecture/reasoning-layer.md`
- `docs/01-architecture/recommendation-engine.md`
- `docs/01-architecture/event-system.md`
- `docs/01-architecture/provider-platform.md`
- `docs/01-architecture/layers.md`, `request-context.md`, `domain-layer.md`
- `docs/03-product/ai-philosophy.md`

### Code (unchanged from prior revision)

- `packages/{core,domain,application,database,permissions,events,audit,ai}/**`
- `apps/web/lib/*.ts`, `apps/web/app/actions/**`, execution UI routes
- `packages/database/prisma/schema.prisma` + three migrations
- `packages/events/src/{repository,types,service,idempotency}.ts`
- `packages/database/src/events/prisma-event-repository.ts`
