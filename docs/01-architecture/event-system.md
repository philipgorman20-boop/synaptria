# Event System

Status: Proposed

Version: 0.1

Purpose

The Event System records, publishes, and delivers immutable facts about meaningful changes within Synaptria.

It supports proactive intelligence, Context Engine assembly, auditability, replay, integrations, workflow reactions, and Organizational Memory candidate generation.

Core Distinction

Operational events record what happened.

Organizational Memory preserves what should continue to matter.

Event Categories

Domain Events

Business-significant changes emitted by domain or application operations.

Integration Events

Stable external contracts used between services or integrations.

Audit Events

Records of actor activity and security-relevant operations.

System Events

Infrastructure and platform lifecycle events.

These categories may share infrastructure but have distinct semantics.

Event Contract

Conceptually:

Domain Event

├── Event ID

├── Event Type

├── Schema Version

├── Organization ID

├── Aggregate Type

├── Aggregate ID

├── Actor ID

├── Request ID

├── Correlation ID

├── Causation ID

├── Idempotency Key

├── Occurred At

├── Recorded At

├── Payload

├── Metadata

└── Status

Design Principles

Events are immutable.

Event types are versioned.

Tenant ownership is explicit.

Actor and request identity are queryable.

Publication is reliable.

Consumers are idempotent.

Ordering is defined where required.

Replay is supported deliberately.

Events do not contain unrestricted sensitive data.

Event Lifecycle

Business Operation

```
  ↓
```

Transaction

```
  ├── State Change

  └── Event Persisted

  ↓
```

Pending Event

```
  ↓
```

Publisher / Dispatcher

```
  ↓
```

Consumer Delivery

```
  ↓
```

Processed / Failed / Dead Letter

Transactional Consistency

State changes and event persistence should occur in the same database transaction where practical.

A transactional outbox pattern is preferred for reliable publication.

Consumers

Potential consumers include:

Context read models,

Mission Control,

notifications,

integrations,

recommendation triggers,

analytics,

Organizational Memory candidate detection,

audit projections.

Consumers should be independently deployable or executable and idempotent.

Event Query Requirements

Entity-scoped Context Engine MVPs may query by aggregate.

Broader capabilities require organization and time-window reads, including:

what changed since a timestamp,

recent events for an organization,

unprocessed events,

events by type,

correlated events,

actor activity.

These queries may be implemented through repository extensions or dedicated read models.

Ordering

Global ordering is rarely necessary.

Ordering may be required per:

aggregate,

organization,

correlation flow,

workflow instance.

Ordering guarantees must be explicit.

Idempotency

Consumers should record processed event identifiers or use idempotency keys to prevent duplicate effects.

Producer-side idempotency may also be required for repeated commands.

Replay

Replay may support:

rebuilding read models,

evaluating new Context Providers,

debugging,

historical simulation,

migration,

recommendation evaluation.

Replay should never silently re-execute irreversible external side effects.

Schema Evolution

Event schemas should be versioned.

Consumers should declare compatible versions.

Breaking changes require new versions or explicit upcasters.

Security

Events should:

remain tenant-scoped,

avoid unnecessary sensitive content,

preserve permission-relevant metadata,

apply retention policies,

prevent cross-tenant consumption.

Failure Handling

Failed delivery should support:

retry policy,

exponential backoff,

failure classification,

dead-letter handling,

manual replay,

observability.

Observability

Track:

pending events,

publish latency,

consumer lag,

processing success,

retries,

dead letters,

duplicate suppression,

throughput,

replay activity.

Current-State Implications

Synaptria already persists domain events, but the proactive AI architecture additionally requires:

event consumers,

broader organization/time-window event reads,

explicit replay and idempotency strategy,

clearer first-class identity fields where justified.

Non-Goals

The Event System is not:

Organizational Memory,

a document store,

a recommendation engine,

a general analytics warehouse,

a substitute for current-state repositories.

Future Directions

transactional outbox dispatcher,

streaming infrastructure,

event projections,

domain-specific event catalogs,

external webhooks,

event-driven Context Package refresh,

replay environments.

Guiding Principle

The Event System should make meaningful change observable, reliable, replayable, and safe to consume without confusing history with institutional knowledge.