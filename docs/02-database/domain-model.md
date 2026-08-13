# Context Domain Model

**Status:** Target specification (Phase 1)  
**Version:** 0.1  
**Date:** 2026-08-12  
**Scope:** Minimum domain and application contracts for the first **deterministic, provider-independent Context Engine** implementation.

**Sources:**

- `docs/02-database/domain-model-assessment.md`
- `docs/03-product/ai-philosophy.md`
- `docs/01-architecture/{context-engine,organizational-memory,reasoning-layer,recommendation-engine,event-system,provider-platform}.md`
- Current code in `packages/domain`, `packages/application`, `packages/database`, `packages/events`, `packages/permissions`, `packages/core`

**Non-goals for Phase 1:** LLM integration, embeddings, vector search, durable Organizational Memory storage, recommendation persistence, event consumers beyond minimum context reads, autonomous workflow execution, new Prisma tables for context artifacts.

---

## 1. Purpose

This document defines the **target domain model** for Synaptria’s first Context Engine delivery.

It answers:

- Which concepts already exist in the operational domain?
- Which new contracts are required for deterministic context assembly?
- Where each concept lives in the package structure?
- What is explicitly deferred to later phases?

Phase 1 defines **reusable context value objects** only. Phase 2 introduces the deterministic assembler that produces read-only, permission-aware `ContextPackage` outputs for execution entities (`Project`, `Milestone`) without foundation-model providers, without new persistence for context artifacts, and without conflating operational event history with Organizational Memory.

Aligned with:

- `docs/01-architecture/context-engine.md` — Context before intelligence; immutable Context Packages; permission-aware retrieval
- `docs/01-architecture/overview.md` — Initial delivery: context contracts → deterministic assembler → broader event reads
- `docs/03-product/ai-philosophy.md` — Observe → Understand loop begins with trusted context, not model calls

---

## 2. Architectural Position

```text
Operational repositories (existing)
        │
        ▼
ContextProvider implementations (application)
        │
        ▼
ContextAssemblerService (application)
        │
        ▼
ContextPackage (domain value object — ephemeral output)
        │
        ├──► (Phase 2) tests, Mission Control read models, logging
        │
        └──► (deferred) Reasoning Layer → Recommendation Engine → Provider Platform
```

| Layer | Phase 1 responsibility |
| --- | --- |
| **Domain** (`@synaptria/domain/context`) | Reusable context value objects and pure validation helpers |
| **Application** (`@synaptria/application/modules/context`) | *(Phase 2)* ports, assembler, provider orchestration, capability definitions |
| **Infrastructure** (`@synaptria/database`, `@synaptria/events`) | Existing read adapters only — no new context tables |
| **Delivery** (`apps/web`) | Composition root wiring; no context logic in route handlers |

**Package boundary decision:** Add a **`context` submodule inside existing `@synaptria/domain` and `@synaptria/application`**. Do **not** create `packages/context` or place Phase 1 contracts in `@synaptria/ai` yet.

| Option | Verdict | Rationale |
| --- | --- | --- |
| `@synaptria/domain` + `@synaptria/application` | **Recommended** | `docs/01-architecture/overview.md` assigns stable contracts to domain and orchestration to application; matches Programs/Projects module pattern |
| New `packages/context` | **Defer** | Premature fragmentation for Phase 1-only contracts; no independent deployment boundary yet |
| `@synaptria/ai` | **Reject for Phase 1** | Context Engine is not the provider layer (`provider-platform.md` § Initial Implementation: provider follows Context Engine) |

---

## 3. Existing Operational Domain

**Classification:** *existing domain entities* and *existing repository ports* — already implemented.

| Entity | Module | Repository port |
| --- | --- | --- |
| `Organization` | `packages/domain/src/organization/` | `OrganizationRepository` |
| `OrganizationMembership` | `packages/domain/src/organization/` | `MembershipRepository` |
| `Program` | `packages/domain/src/programs/` | `ProgramRepository` |
| `Project` | `packages/domain/src/projects/` | `ProjectRepository` |
| `Milestone` | `packages/domain/src/milestones/` | `MilestoneRepository` |
| `Task` | `packages/domain/src/tasks/` | `TaskRepository` |

**Shared value object:** `Priority` — `packages/domain/src/shared/priority.ts` (*existing domain value object*).

**Execution hierarchy (confirmed in code and Prisma):**

```text
Organization → Program → Project → Milestone → Task
```

**Cross-cutting (existing, reused by context assembly):**

| Concept | Package | Classification |
| --- | --- | --- |
| Branded IDs (`OrganizationId`, `ProjectId`, …) | `@synaptria/core` | existing infrastructure primitives |
| `RequestContext` | `@synaptria/core` | existing application/delivery input |
| `ApplicationContext` | `@synaptria/application/shared` | existing application contract |
| `Permission`, `requirePermission` | `@synaptria/permissions` | existing authorization |
| `DomainEventEnvelope`, `EventRepository` | `@synaptria/events` | existing event contracts + port |
| `DomainEvent` rows | PostgreSQL via Prisma | *durable persistence record* (operational — not context) |

---

## 4. Bounded Contexts

| Bounded context | Phase 1 role | Status |
| --- | --- | --- |
| **Identity & tenant** | Supplies actor identity and organization scope to `ContextRequest` | Implemented |
| **Execution / portfolio** | Primary and related entity sources for context | Implemented |
| **Platform events** | Aggregate-scoped recent events for context | Partially implemented (`findByAggregate` only) |
| **Context assembly** | Value objects (Phase 1); assembler (Phase 2) | **Phase 1–2 target** |
| **Organizational Memory** | No-op provider (Phase 2); persistence deferred | Deferred persistence |
| **Reasoning** | Consumer of `ContextPackage` | Deferred |
| **Recommendations** | Downstream of reasoning | Deferred |
| **Provider Platform** | Not used in Phase 1 | Deferred |
| **Finance / vendors / documents** | Out of scope | Deferred |

---

## 5. Aggregate Boundaries

Context assembly **reads** across aggregates; it does not mutate them in Phase 1.

| Aggregate root | Context role | Write events (existing) |
| --- | --- | --- |
| `Organization` | Tenant boundary only | `organization.created` |
| `Program` | Related entity when project-linked | `program.created` |
| `Project` | **Primary entity (Phase 1)** | `project.created` |
| `Milestone` | **Primary entity (Phase 1)** | `milestone.created` |
| `Task` | Related entity under milestone | `task.created` |

**Rule:** Phase 2 providers fetch each aggregate through its domain repository port with `organizationId` scope. Providers must not assemble cross-tenant graphs.

---

## 6. Shared AI and Context Concepts

Phase 1 introduces vocabulary shared by Context Engine, and later by Reasoning and Recommendation layers.

| Concept | Classification | Phase |
| --- | --- | --- |
| `EntityReference` | *new domain value object* | 1 |
| `ContextRequest` | *new domain value object* | 1 |
| `ContextScope` | *new domain value object* | 1 |
| `ContextPackage` | *new domain value object* (ephemeral output) | 1 |
| `ContextContribution` | *new domain value object* | 1 |
| `ProvenanceRecord` | *new domain value object* | 1 |
| `EvidenceReference` | *new domain value object* | 1 |
| `ConfidenceAssessment` | *new domain value object* | 1 |
| `ContextCompleteness` | *new domain value object* | 1 |
| `ContextProvider` | *application port* | 2 |
| `OrganizationalMemoryProvider` | *application port* | 2 (no-op impl) |
| Capability definitions / registry | *application contract* | 2 |
| `ContextAssemblerService` | *application service* | 2 |
| `AssembleContextUseCase` | *application contract* (use case) | 2 |
| `Memory` (full typed memory) | *deferred concept* | 6+ |
| `ReasoningResult` | *deferred concept* | 9+ |
| `Recommendation` | *deferred concept* | 10+ |
| `ProviderRequest` / `ProviderResponse` | *deferred concept* | 8+ |

---

## 7. EntityReference

**Classification:** *new domain value object*

Stable pointer to a tenant-owned operational entity. Used in requests, packages, provenance, and evidence.

```typescript
/** Conceptual — not final implementation code */
interface EntityReference {
  readonly organizationId: OrganizationId;
  readonly entityType: EntityType;
  readonly entityId: string;
}

type EntityType =
  | 'Organization'
  | 'Program'
  | 'Project'
  | 'Milestone'
  | 'Task';
```

**Rules:**

- `entityType` uses audit/event aggregate naming already emitted by create use cases (`packages/application/src/modules/*/create-*.ts`).
- `entityId` is the branded ID serialized as string for cross-section stability.
- References are immutable once constructed.

**Location:** `@synaptria/domain/context`

---

## 8. ContextRequest

**Classification:** *new domain value object* (input descriptor; not a use-case DTO with auth fields)

Describes **why** context is assembled (`docs/01-architecture/context-engine.md` § Request).

```typescript
interface ContextRequest {
  readonly primaryEntity: EntityReference;
  readonly objective?: string;
  readonly requestedSections: readonly ContextSectionId[];
}

type ContextSectionId =
  | 'identity'
  | 'authorization'
  | 'primaryEntity'
  | 'relatedEntities'
  | 'events'
  | 'organizationalMemory'
  | 'provenance'
  | 'metadata';
```

**Rules:**

- `ContextRequest` is serializable and provider-independent.
- Duplicate entries in `requestedSections` are invalid (Phase 1 validation).
- Authorization identity (`userId`, `role`) is **not** embedded — supplied separately via trusted `ApplicationContext` at assembly time (*application contract* boundary).
- No Prisma persistence.
- Capability identifiers (`capabilityId`, `capabilityVersion`) are **not** on `ContextRequest` in Phase 1. They are introduced in Phase 2 via capability definitions that wrap or accompany the request at assembly time.

**Location:** `@synaptria/domain/context`

---

## 9. ContextScope

**Classification:** *new domain value object*

Defines deterministic **read boundaries** for assembly: which descendant entity types may be loaded and event lookback limits.

```typescript
interface ContextScope {
  readonly organizationId: OrganizationId;
  readonly primaryEntity: EntityReference;
  readonly includeDescendants: readonly EntityType[];
  readonly eventLookbackPerAggregate: number;
  readonly maxContributions: number;
}
```

**Rules:**

- `ContextScope` is capable of representing descendant entity inclusion via `includeDescendants` (e.g. `Program`, `Milestone`, `Task`).
- Duplicate entries in `includeDescendants` are invalid (Phase 1 validation).
- **Individual capability definitions** (Phase 2) determine which descendants are actually loaded for a given assembly — not the domain model alone.
- A capability such as `project.intelligence.v0` may omit `Task` from `includeDescendants` for performance or relevance; that is a **capability decision**, not a domain-model constraint.
- Scope is derived from capability definition + `ContextRequest` — not client-supplied.
- Scope limits prevent unbounded graph expansion (`context-engine.md` — optimized for understanding, not volume).

**Location:** `@synaptria/domain/context`

---

## 10. ContextPackage

**Classification:** *new domain value object* → assembled output is an **ephemeral runtime object**

Immutable, serializable result of context assembly. The sole artifact downstream reasoning may consume (`context-engine.md` § Context Package).

```typescript
interface ContextPackage {
  readonly packageId: ContextPackageId;
  readonly packageVersion: number;
  readonly assembledAt: Date;
  readonly request: ContextRequest;
  readonly identity: ContextIdentity;
  readonly authorization: ContextAuthorization;
  readonly primaryEntity: ContextContribution;
  readonly relatedEntities: readonly ContextContribution[];
  readonly events: readonly ContextContribution[];
  readonly organizationalMemory: readonly ContextContribution[];
  readonly provenance: readonly ProvenanceRecord[];
  readonly confidence: ConfidenceAssessment;
  readonly completeness: ContextCompleteness;
  readonly metadata: ContextPackageMetadata;
}

interface ContextIdentity {
  readonly userId: UserId;
  readonly organizationId: OrganizationId;
  readonly membershipId: MembershipId;
  readonly requestId: RequestId;
  readonly correlationId: CorrelationId;
}

interface ContextAuthorization {
  readonly role: OrganizationRole;
  readonly effectivePermissions: readonly string[];
}

interface ContextPackageMetadata {
  readonly deterministic: true;
}
```

**Phase 1 metadata:** `deterministic: true` marks packages produced by deterministic assembly paths. Schema versioning lives on `ContextPackage.packageVersion`.

**Phase 2 metadata (deferred):** When the assembler and capability definitions exist, additional metadata such as `assemblerVersion`, `capabilityId`, and `capabilityVersion` may be introduced at the application boundary. They are **not** part of the Phase 1 domain contract.

**Rules:**

- **Immutable after construction** — no mutating methods (`context-engine.md`).
- **Serializable** to JSON for tests, debug logs, and future evaluation fixtures.
- **No Prisma table** in Phase 1. Optional future durable retention for audit/evaluation only if a separate requirement emerges — not for operational state.
- `packageId` is a newly generated branded ID per assembly (ephemeral correlation, not a database key).

**Location:** `@synaptria/domain/context`

---

## 11. ContextContribution

**Classification:** *new domain value object*

A typed slice of context contributed by one provider. Wraps serializable payload plus provenance.

```typescript
interface ContextContribution {
  readonly contributorId: ContextContributorId;
  readonly section: ContextSectionId;
  readonly subject: EntityReference | null;
  readonly payload: ContextPayload;
  readonly provenance: ProvenanceRecord;
}

type ContextContributorId = Identifier<'ContextContributorId'>;

type ContextPayload = ContextJsonObject;

type ContextJsonObject = Readonly<{ [key: string]: ContextJsonValue }>;
type ContextJsonValue = string | number | boolean | null | ContextJsonObject | readonly ContextJsonValue[];
```

**Known contributor IDs (examples only — not an exhaustive registry):**

| Example ID | Phase 2 role |
| --- | --- |
| `operational.primaryEntity` | Primary entity provider |
| `operational.relatedEntities` | Related-entity provider |
| `operational.events` | Aggregate event provider |
| `organizationalMemory` | Organizational Memory provider |
| `audit.evidence` | Audit evidence provider (deferred) |

Phase 1 may export these as reference constants (e.g. `KNOWN_CONTEXT_CONTRIBUTOR_IDS`) for convenience. Application-layer providers may introduce additional contributor IDs without domain-model changes.

**Phase 2 payload conventions (illustrative — not Phase 1 validation rules):**

| Contributor | Payload contents |
| --- | --- |
| `operational.primaryEntity` | Domain entity serialized to plain JSON (Program/Project/Milestone fields only — no Prisma types) |
| `operational.relatedEntities` | `{ entities: [...] }` array of serialized domain entities |
| `operational.events` | `{ events: [...] }` subset of `DomainEventEnvelope` fields safe for context |
| `organizationalMemory` | `{ memories: [] }` — empty until memory persistence exists |

**Rules:**

- Contributions are **facts from authorized sources**, not inferences.
- No LLM-generated content.
- Multiple contributions from the same `contributorId` to the same `section` are **valid** (e.g. one contribution per related entity or event).
- Phase 1 validation rejects duplicate entries in `ContextRequest.requestedSections` and `ContextScope.includeDescendants` only.
- Phase 1 does **not** require a particular `contributorId` for `primaryEntity` or other sections — that belongs to Phase 2 assembler policy.

**Location:** `@synaptria/domain/context`

---

## 12. ContextProvider

**Classification:** *application port* — orchestration concern, not domain semantics. Implementations are *application services* that call existing domain repository ports and infrastructure adapters.

```typescript
interface ContextProvider {
  readonly contributorId: ContextContributorId;
  readonly sections: readonly ContextSectionId[];
  contribute(input: ContextProviderInput): Promise<readonly ContextContribution[]>;
}

interface ContextProviderInput {
  readonly request: ContextRequest;
  readonly scope: ContextScope;
  readonly identity: ContextIdentity;
  readonly authorization: ContextAuthorization;
}
```

**Phase 2 implementations (application layer):**

| Implementation | Classification | Reads via |
| --- | --- | --- |
| `PrimaryEntityContextProvider` | *application service* | Domain repository for primary entity |
| `RelatedEntitiesContextProvider` | *application service* | Domain repositories (deterministic graph) |
| `AggregateEventContextProvider` | *application service* | `EventRepository.findByAggregate` |
| `NoOpOrganizationalMemoryProvider` | *application service* | Returns empty contributions |

**Rules:**

- Providers perform **permission checks** before reads (`requirePermission` + entity-type permissions).
- Providers return `[]` when unauthorized — they do not throw for missing read access on related entities unless primary entity is inaccessible (assembler returns typed failure).
- Providers are **deterministic**: same inputs + same repository state → equivalent contributions.

**Port location:** `@synaptria/application/modules/context`  
**Implementation location:** `@synaptria/application/modules/context/providers/`

---

## 13. ProvenanceRecord

**Classification:** *new domain value object*

Every material fact in a Context Package must be traceable (`context-engine.md` § Provenance).

```typescript
interface ProvenanceRecord {
  readonly sourceSystem: 'synaptria.operational' | 'synaptria.events' | 'synaptria.organizationalMemory';
  readonly sourceType: string;
  readonly sourceId?: string;
  readonly retrievalMethod: 'repository.read' | 'repository.list' | 'eventRepository.findByAggregate' | 'memoryProvider.retrieve';
  readonly retrievedAt: Date;
  readonly permissionScope: readonly string[];
}
```

**Rules:**

- One provenance record minimum per `ContextContribution`.
- Phase 1 uses `retrievedAt` as the available **freshness signal** — when the fact was retrieved relative to assembly time.
- Broader freshness classification (e.g. cached vs live) is **not** modeled in Phase 1. It may be introduced later if a capability requires it; do not invent cache or provider policy in the domain contract.
- In Phase 2, `retrievedAt` is set from the assembler clock (`Clock` from `@synaptria/core`).
- No provider names, model names, or embedding indexes in the assembler.

**Location:** `@synaptria/domain/context`

---

## 14. EvidenceReference

**Classification:** *new domain value object*

Pointer to supporting material without embedding document content in Phase 1.

```typescript
interface EvidenceReference {
  readonly evidenceType: 'operationalEntity' | 'domainEvent' | 'auditEvent' | 'memory' | 'document';
  readonly reference: EntityReference | { readonly eventId: DomainEventId } | { readonly auditEventId: string };
  readonly description?: string;
}
```

**Phase 1 usage:**

- `ContextContribution.provenance` covers operational provenance.
- `EvidenceReference` is included in contribution payloads where useful (e.g., event contributions reference `eventId`).
- Full audit/document evidence provider — **deferred** (no `AuditRepository` read port today).

**Location:** `@synaptria/domain/context`

---

## 15. ConfidenceAssessment

**Classification:** *new domain value object*

Summarizes trust in the assembled package (`context-engine.md`; `organizational-memory.md` § graceful degradation).

```typescript
interface ConfidenceAssessment {
  readonly level: ConfidenceLevel;
  readonly factors: readonly ConfidenceFactor[];
  readonly explanation: string;
}

type ConfidenceLevel = 'high' | 'medium' | 'low';

interface ConfidenceFactor {
  readonly code: ConfidenceFactorCode;
  readonly impact: 'increase' | 'decrease' | 'neutral';
  readonly message: string;
}

type ConfidenceFactorCode =
  | 'primaryEntityResolved'
  | 'relatedEntitiesPartial'
  | 'relatedEntitiesComplete'
  | 'eventsIncluded'
  | 'organizationalMemoryUnavailable'
  | 'organizationalMemoryEmpty'
  | 'permissionRestrictedSlice';
```

**Phase 2 assembler deterministic rules:**

| Condition | Level adjustment |
| --- | --- |
| Primary entity found + caller authorized | Base `high` |
| Organizational Memory empty (expected initially) | `medium` + factor `organizationalMemoryEmpty` (not an error) |
| Related entity skipped due to permissions | `medium` + `permissionRestrictedSlice` |
| Primary entity not found | Assembly **fails** — no package produced |

**Rules:**

- Phase 2 assembler does **not** use probabilistic or model-based confidence.
- Confidence is computed by assembler policy, not LLM self-report.

**Location:** `@synaptria/domain/context`

---

## 16. Context Completeness and Degradation

**Classification:** *new domain value object* (`ContextCompleteness`) + assembler policy in *application service*

```typescript
interface ContextCompleteness {
  readonly status: CompletenessStatus;
  readonly missingSections: readonly ContextSectionId[];
  readonly degradationNotes: readonly string[];
}

type CompletenessStatus =
  | 'complete'
  | 'degraded'
  | 'insufficient';
```

**Degradation policy (Phase 2 assembler):**

| Section | Missing cause | Behavior |
| --- | --- | --- |
| `organizationalMemory` | No memory provider data | **Degraded** — empty contribution; confidence lowered |
| `events` | No events for aggregate | **Complete** — empty events array is valid |
| `relatedEntities` | Partial permission denial | **Degraded** — include allowed subset |
| `primaryEntity` | Not found or no permission | **Insufficient** — fail assembly |

Aligned with `organizational-memory.md`: *If memory is unavailable and the capability can degrade gracefully, confidence must decrease.*

**Location:** `@synaptria/domain/context` (type); `@synaptria/application/modules/context` (policy)

---

## 17. OrganizationalMemoryProvider Port

**Classification:** *application port* — Phase 2 no-op implementation is an *application service*

Organizational Memory is **curated institutional knowledge**, not raw event history (`organizational-memory.md`; `event-system.md` Core Distinction).

```typescript
interface OrganizationalMemoryProvider extends ContextProvider {
  readonly contributorId: ContextContributorId; // e.g. 'organizationalMemory'
  retrieve(input: OrganizationalMemoryQuery): Promise<readonly MemoryContribution[]>;
}

interface OrganizationalMemoryQuery {
  readonly request: ContextRequest;
  readonly scope: ContextScope;
  readonly identity: ContextIdentity;
  readonly authorization: ContextAuthorization;
  readonly operationalContext: readonly ContextContribution[];
}

interface MemoryContribution {
  readonly memoryType: MemoryType;
  readonly summary: string;
  readonly confidence: number;
  readonly provenance: ProvenanceRecord;
  readonly evidence: readonly EvidenceReference[];
}

type MemoryType =
  | 'decision'
  | 'scientific'
  | 'process'
  | 'customer'
  | 'risk'
  | 'lesson'
  | 'preference'
  | 'exception'
  | 'policy'
  | 'relationship'
  | 'meta';
```

**Phase 2:** `NoOpOrganizationalMemoryProvider` returns `[]`. Operational context is assembled first; memory query receives operational contributions per `organizational-memory.md` § Integration with the Context Engine.

**Deferred:** Full `Memory` entity, lifecycle (Candidate → Published → Retired), curation services, durable storage (`organizational-memory.md` § Typed Memory Contracts — contracts independent of storage).

**Port location:** `@synaptria/application/modules/context`  
**No-op location:** `@synaptria/application/modules/context/providers/no-op-organizational-memory-provider.ts`

---

## 18. Event Context Requirements

**Classification:** reads use *existing infrastructure adapter*; broader queries *deferred*

| Requirement | Phase | Classification | Evidence |
| --- | --- | --- | --- |
| Aggregate-scoped event history | **Phase 2** | `EventRepository.findByAggregate` — *infrastructure adapter* | `packages/events/src/repository.ts` |
| Organization/time-window queries | **Deferred** | Future port extension | `event-system.md` § Event Query Requirements; not in code |
| Event consumer / dispatcher | **Deferred** | — | Not implemented |
| Producer idempotency | **Deferred** | — | `packages/events/src/idempotency.ts` unused |
| Consumer idempotency | **Deferred** | — | — |
| Replay tooling | **Deferred** | — | — |

**Phase 2 event contribution shape** (subset of `DomainEventEnvelope`):

```typescript
interface ContextEventSnapshot {
  readonly id: string;
  readonly eventType: string;
  readonly eventVersion: number;
  readonly aggregateType: string;
  readonly aggregateId: string;
  readonly occurredAt: string;
  readonly payload: ContextJsonObject;
}
```

**Rules:**

- Events included in context are **operational history**, not Organizational Memory.
- Events filtered to aggregates in `ContextScope` only.
- Ordering: `occurredAt` descending, limited by `eventLookbackPerAggregate`.

---

## 19. Permission and Tenant Rules

**Classification:** enforced in *application service* using existing *infrastructure* permissions module

| Rule | Enforcement |
| --- | --- |
| Every assembly runs under trusted `ApplicationContext` | Delivery constructs from `getRequestContext()` — `apps/web/lib/request-context.ts` |
| `organizationId` on every repository call matches context | Existing repository pattern |
| Primary entity read requires entity-appropriate `*_READ` permission | e.g. `PROJECTS_READ`, `MILESTONES_READ` — `packages/permissions/src/permissions.ts` |
| Related entities skipped silently when read permission missing | Degraded completeness |
| Primary entity inaccessible → assembly fails | Typed application error |
| Organizational Memory: default deny, least privilege | Documented in `organizational-memory.md`; no-op provider in Phase 2 |
| Client-supplied tenant IDs never trusted | Existing architecture rule |

**Permission map (Phase 2 assembly):**

| Entity | Read permission |
| --- | --- |
| Program | `PROGRAMS_READ` |
| Project | `PROJECTS_READ` |
| Milestone | `MILESTONES_READ` |
| Task | `TASKS_READ` |

---

## 20. Serialization and Versioning

| Artifact | Versioning strategy | Persistence |
| --- | --- | --- |
| `ContextPackage.packageVersion` | Schema version of package shape | Ephemeral |
| Capability / assembler metadata (Phase 2) | `capabilityId`, `capabilityVersion`, `assemblerVersion` on extended metadata | Ephemeral |
| Domain event `eventVersion` | Already on envelope | Durable (existing) |
| Operational entities | Domain model evolution via migrations | Durable (existing) |

**Serialization rules:**

- Context Package must round-trip through JSON for tests and future evaluation fixtures (`context-engine.md`).
- Dates as ISO 8601 strings in serialized form.
- Branded IDs serialize as strings.
- No Prisma types in serialized payloads.

**Phase 1 package version:** `packageVersion: 1`

---

## 21. Ephemeral vs Durable Concepts

### Ephemeral (Phase 1 — no new tables)

| Concept | Classification |
| --- | --- |
| `ContextRequest` | ephemeral runtime object |
| `ContextScope` | ephemeral runtime object |
| `ContextPackage` | ephemeral runtime object |
| `ContextContribution` | ephemeral runtime object |
| `ProvenanceRecord` | ephemeral runtime object (embedded) |
| `EvidenceReference` | ephemeral runtime object (embedded) |
| `ConfidenceAssessment` | ephemeral runtime object |
| `ContextCompleteness` | ephemeral runtime object |
| Assembler intermediate state | ephemeral runtime object |

### Durable (existing — reused, not new)

| Concept | Classification |
| --- | --- |
| Organization, Program, Project, Milestone, Task | durable persistence record |
| `DomainEvent` | durable persistence record |
| `AuditEvent` | durable persistence record |
| `AiRun` | durable persistence record (*deferred use*) |

### Deferred durable (not Phase 1)

| Concept | Classification |
| --- | --- |
| Organizational Memory entries | deferred concept |
| Recommendation records | deferred concept |
| Provider request/response logs | deferred concept (future `AiRun`) |
| Context Package audit retention | deferred concept — justify only if evaluation/compliance requires |

---

## 22. Package Boundaries

### `@synaptria/domain/context` (new submodule — Phase 1)

| Export | Classification |
| --- | --- |
| `EntityReference`, `ContextRequest`, `ContextScope`, `ContextPackage`, `ContextContribution`, `ProvenanceRecord`, `EvidenceReference`, `ConfidenceAssessment`, `ContextCompleteness` | *new domain value objects* |
| `ContextSectionId` (closed section vocabulary) | *new domain value object* |
| `ContextContributorId` (extensible branded identifier) | *new domain value object* |
| Pure validation helpers (reference well-formedness, JSON shape guards, duplicate section/descendant rejection) | *domain logic* |

**Dependencies:** `@synaptria/core` only. Use `readonly string[]` for permission fields in `ContextAuthorization` and `ProvenanceRecord`; map from `@synaptria/permissions` at the application boundary.

### `@synaptria/application/modules/context` (new module — Phase 2)

| Export | Classification |
| --- | --- |
| `ContextProvider`, `OrganizationalMemoryProvider` | *application ports* |
| Capability definitions, capability registry, scope resolver | *application contract* / *application service* |
| `AssembleContextUseCase` | *application contract* |
| `ContextAssemblerService` | *application service* |
| Provider implementations | *application services* |
| Composition wiring | consumed by `apps/web/lib/context-service.ts` (*infrastructure composition*) |

**Dependencies:** `@synaptria/domain/context`, `@synaptria/domain/{programs,projects,milestones,tasks}`, `@synaptria/events`, `@synaptria/permissions`, `@synaptria/core`

**Must not depend on:** `@synaptria/database` directly (receive repositories via constructor injection from composition root — same pattern as `apps/web/lib/project-service.ts`).

### `@synaptria/ai` (unchanged Phase 1)

Reserved for provider adapters (`provider-platform.md`). **No Phase 1 exports.**

### `@synaptria/database` (unchanged Phase 1)

Existing Prisma adapters only. **No context tables.**

---

## 23. Explicitly Deferred Concepts

| Concept | Reason | Target phase (from assessment) |
| --- | --- | --- |
| LLM / foundation-model integration | Context before intelligence | 8+ |
| Embeddings | Non-deterministic; not required for v0 | — |
| Vector / semantic search | Not deterministic v0 | — |
| Durable Organizational Memory storage | Contracts first (`organizational-memory.md`) | 6–7 |
| Full `Memory` lifecycle services | Depends on memory persistence | 7+ |
| `ReasoningResult` and Reasoning Layer | Downstream of Context Package | 9 |
| `Recommendation` and persistence | Downstream of reasoning | 10 |
| Provider Platform adapters | Follows Context Engine | 8 |
| Event dispatcher / consumers | Beyond minimum read for context | 3 |
| Organization/time-window event queries | Port extension needed | 3 |
| Producer/consumer idempotency wiring | Requires dispatcher | 4 |
| Audit read provider for evidence | No read port on `AuditRepository` | 5 |
| Autonomous workflow execution | Overview non-goal for first delivery | — |
| Risks / Opportunities context sections | No operational domain yet | — |
| Mission Control UI | After assembler tests | 2 |
| Daily Briefing / project intelligence LLM features | Provider-dependent | 8+ |

---

## 24. Testing Strategy

| Layer | Approach |
| --- | --- |
| **Domain (`context`)** — Phase 1 | Unit tests for validation and value-object well-formedness; duplicate `requestedSections` / `includeDescendants` rejection; multiple contributions per contributor+section allowed |
| **Application (`context`)** — Phase 2 | Use case tests with in-memory fake repositories and fake `EventRepository` — mirror pattern in `packages/application/src/modules/projects/create-project.test.ts` |
| **Providers** | Test each provider independently: permission denial, empty events, missing program |
| **Assembler** | Golden-file JSON tests: deterministic `ContextPackage` output for fixture entity graphs |
| **Tenant isolation** | Cross-organization fixture proves no data leakage |
| **Degradation** | Assert `organizationalMemoryEmpty` factor and `degraded` completeness with no-op memory provider |

**No database required** for Phase 1 domain tests. Phase 2 assembler tests use in-memory fakes only. Optional Prisma integration test later — not a Phase 2 gate.

---

## 25. Implementation Phases

### Phase 1 — Context value objects (this document)

| Deliverable | Package |
| --- | --- |
| Domain value objects listed in §22 | `@synaptria/domain/context` |
| Pure validation helpers | `@synaptria/domain/context` |
| Unit tests for types and validation | `@synaptria/domain/context` |

**Exit criteria:** Types compile; validation tests pass; **no application module, ports, assembler, or capability definitions**.

### Phase 2 — Deterministic assembler (immediate follow-on)

| Deliverable | Package |
| --- | --- |
| `ContextProvider`, `OrganizationalMemoryProvider` ports | `@synaptria/application/modules/context` |
| Capability definitions (`project.intelligence.v0`, `milestone.intelligence.v0`) and scope resolver | `@synaptria/application/modules/context` |
| `AssembleContextUseCase`, `ContextAssemblerService` | `@synaptria/application/modules/context` |
| Provider implementations (including no-op memory provider) | `@synaptria/application/modules/context` |
| `getContextService()` composition root | `apps/web/lib/context-service.ts` |
| Golden tests for Project and Milestone capabilities | application tests |

**Exit criteria:** Given seeded in-memory fixtures, assembler produces stable JSON packages with correct permissions and degradation.

### Later phases (unchanged from assessment)

| Phase | Scope |
| --- | --- |
| 3 | Event read extensions + dispatcher |
| 4 | Idempotency / replay foundations |
| 5 | Audit read + membership admin |
| 6–7 | Organizational Memory contracts + persistence |
| 8+ | Provider Platform, Reasoning, Recommendation |

---

## 26. Open Decisions

| # | Decision | Options | Recommendation |
| --- | --- | --- | --- |
| 1 | Domain dependency on `@synaptria/permissions` for `Permission` type | (a) add dependency (b) use plain strings | **(b)** keep domain depending on `@synaptria/core` only; map permissions at application boundary |
| 2 | Export path for context module | (a) `@synaptria/domain/context` (b) root export | **(a)** subpath export matching programs/projects pattern |
| 3 | Primary entity permission failure | (a) throw (b) insufficient package | **(a)** throw typed `ApplicationError` — primary entity is required |
| 4 | Serialize domain entities in contributions | (a) explicit mappers (b) structured field picks | **(a)** explicit mappers in application providers — no Prisma, no blind spread |
| 5 | Context package durable retention for evaluation | defer until evaluation pipeline exists | **Defer** — ephemeral by default |
| 6 | Event lookback default | configurable per capability vs constant | **Constant in capability definition** (Phase 2) for determinism |
| 7 | Provenance freshness classification | (a) `retrievedAt` only (b) explicit freshness enum | **(a) Phase 1** — `retrievedAt` only; broader classification deferred until a capability requires it |
| 8 | Per-entity branded ID validation on `EntityReference.entityId` | (a) validate by `entityType` (b) generic non-empty string | **(b) Phase 1** — generic string; entity-type-specific branded validation deferred to Phase 2 providers/mappers if needed |

---

## Appendix: Concept Classification Summary

| Concept | Classification |
| --- | --- |
| Organization, Program, Project, Milestone, Task | existing domain entity |
| Priority, branded IDs | existing domain value object / core primitive |
| EntityReference, ContextRequest, ContextScope, ContextPackage, ContextContribution, ProvenanceRecord, EvidenceReference, ConfidenceAssessment, ContextCompleteness | new domain value object |
| ContextSectionId, ContextContributorId | new domain value object |
| ContextProvider, OrganizationalMemoryProvider | application port |
| Capability definitions / registry | application contract |
| AssembleContextUseCase, AssembleContextInput/Output | application contract |
| ContextAssemblerService, *ContextProvider implementations | application service |
| Prisma*Repository, PrismaEventRepository | infrastructure adapter |
| ContextPackage at runtime | ephemeral runtime object |
| DomainEvent, AuditEvent, operational entities in PostgreSQL | durable persistence record |
| Memory, ReasoningResult, Recommendation, ProviderRequest/Response, embeddings, vector search, event dispatcher, autonomous execution | deferred concept |

---

## Appendix: Phase 2 Assembly Flow

```text
ApplicationContext + ContextRequest
        │
        ▼
ContextAssemblerService
        │
        ├── resolve capability definition → ContextScope
        ├── build ContextAuthorization from role
        │
        ├── PrimaryEntityContextProvider ──► Program/Project/Milestone repository
        ├── RelatedEntitiesContextProvider ──► repository list/find (per capability)
        ├── AggregateEventContextProvider ──► EventRepository.findByAggregate
        └── NoOpOrganizationalMemoryProvider ──► []
        │
        ▼
ContextPackage (immutable, serializable, ephemeral)
```

**No LLM. No new Prisma models. No embeddings.**
