# Synaptria Implementation Playbook

> **Version:** 1.0  

> **Status:** Living Document  

> **Location:** `/docs/implementation-playbook.md`  

> **Last Updated:** July 2026

---

# Purpose

This playbook defines the standard implementation methodology for every Synaptria module.

It documents **how Synaptria is built**, not simply what it does.

Its goals are to:

- Maintain architectural consistency

- Produce predictable implementations

- Enable efficient AI-assisted development

- Preserve a clean Git history

- Simplify code reviews

- Ensure long-term maintainability

Every completed module should become a **reference implementation** for future modules.

> **Primary Principle:** Consistency is preferred over cleverness.

---

# Core Architecture

Synaptria follows a layered Clean Architecture.

```

Core

    ↓

Permissions

    ↓

Domain

    ↓

Application

    ↓

Database

    ↓

Web

```

Dependencies always point downward.

A lower layer must never depend on a higher layer.

---

# Layer Responsibilities

## Core

### Contains

- Branded IDs

- Shared utilities

- Error types

- Result types

- Cross-cutting abstractions

### Never Contains

- Business rules

- Prisma

- React

- Next.js

- HTTP

---

## Permissions

### Contains

- Permission constants

- Role definitions

- Authorization metadata

### Never Contains

- Business logic

- Persistence

- Transport concerns

---

## Domain

### Contains

- Entities

- Value Objects

- Enums

- Repository interfaces

- Domain contracts

- Domain-specific types

### Never Contains

- Prisma

- SQL

- React

- Next.js

- Authorization

- Request context

- HTTP

- UI concerns

---

## Application

The Application layer owns **all business behavior**.

### Responsible For

- Use cases

- Business rules

- Validation

- Authorization

- Default values

- Parent existence validation

- Audit orchestration

- Domain events

### Never

- Import Prisma

- Parse FormData

- Use React

- Know HTTP

- Render UI

---

## Database

Responsible only for persistence.

### Responsible For

- Prisma repositories

- Mapping

- Persistence

- Tenant scoping

- Soft-delete filtering

- Transaction participation

- Database conflict translation

### Never

- Validate business rules

- Perform authorization

- Assign defaults

- Validate parent entities

---

## Web

Responsible for presentation orchestration.

### Responsible For

- Authentication

- Request context

- FormData parsing

- Server Actions

- Route composition

- UI-safe error mapping

- Redirects

- Page composition

### Never

- Query Prisma directly

- Implement business rules

- Authorize independently

- Trust browser tenant data

---

# Responsibility Matrix

| Concern | Domain | Application | Database | Web |

|----------|---------|-------------|-----------|------|

| Business Validation | ❌ | ✅ | ❌ | Transport only |

| Authorization | ❌ | ✅ | ❌ | Presentation only |

| Default Values | ❌ | ✅ | ❌ | ❌ |

| Tenant Context | ❌ | Context | ✅ | Context |

| Prisma | ❌ | ❌ | ✅ | ❌ |

| React | ❌ | ❌ | ❌ | ✅ |

---

# Standard Module Lifecycle

Every Synaptria module follows six implementation phases.

---

# Step 1 — Domain

## Deliverables

- Permissions

- IDs

- Domain model

- Repository interface

- Create/Update contracts

- Exports

- Unit tests

## Do NOT Implement

- Prisma

- Use Cases

- Server Actions

- UI

## Review Checklist

- Domain free of Prisma?

- No React?

- No authorization?

- Repository contracts complete?

## Commit

```text

feat(<entity>): implement domain layer

```

---

# Step 2 — Application

## Deliverables

- Use cases

- Services

- Unit of Work

- Validation

- Authorization

- Events

## Review Checklist

- Business rules centralized?

- Parent validation here?

- Defaults here?

- No Prisma?

- No HTTP?

## Commit

```text

feat(<entity>): implement application layer

```

---

# Step 3 — Persistence

## Deliverables

- Prisma repository

- Mapping

- Select constants

- Transaction wiring

- Integration tests

## Repository Responsibilities

- Persistence

- Tenant filtering

- Soft-delete filtering

- Null → undefined mapping

- Conflict translation

## Never

- Authorization

- Defaults

- Parent validation

- Business logic

## Review Checklist

- Tenant scoped?

- Soft-delete filtered?

- Clean mapper?

- P2002 translated?

- Transaction wiring correct?

## Commit

```text

feat(<entity>): implement persistence layer

```

---

# Step 4 — Web Composition

## Deliverables

- Composition root

- Request context mapping

- Server Actions

- Form parsing

- Action state

## Review Checklist

- Context comes only from server?

- Redirect outside try/catch?

- Uses application services?

- No Prisma?

- Safe error mapping?

## Commit

```text

feat(<entity>): add web composition

```

---

# Step 5 — List UI

## Deliverables

- List page

- Create dialog

- Action integration

- Formatting helpers

## Review Checklist

- Permission gated?

- Accessible?

- Route helpers used?

- No raw IDs?

- Uses server actions?

## Commit

```text

feat(<entity>): add list page

```

---

# Step 6 — Detail UI

## Deliverables

- Detail page

- Relationship composition

- Formatting

- Navigation

## Review Checklist

- Parent composed via services?

- Correct notFound() behavior?

- No raw IDs?

- Read-only?

## Commit

```text

feat(<entity>): add detail page

```

---

# Standard Review Checklist

## Domain

- No Prisma

- No SQL

- No React

- No Next.js

- No navigation properties

---

## Application

- Validation centralized

- Defaults centralized

- Authorization centralized

- Parent validation centralized

---

## Repository

- Organization scoped

- Soft-delete filtered

- Conflict translation

- Null mapping

- No business logic

---

## Web

- Request context only

- Browser never supplies tenant

- Redirect outside try/catch

- Safe action state

---

## UI

- Permission aware

- Accessible

- No raw IDs

- Uses route helpers

- Preserves field errors

- Preserves user input

---

# Multi-Tenant Rules

Always derive:

- organizationId

- userId

- role

from:

```ts

getRequestContext()

```

Never derive them from:

- Hidden form fields

- Query parameters

- Route parameters

- Client cookies

- Browser storage

Repositories must always scope by:

```ts

organizationId

```

---

# Transaction Rules

Use UnitOfWork only when:

- Multiple writes occur

- Audit logging is required

- Events are published

Read-only use cases should receive repositories directly.

---

# Repository Rules

Repositories perform:

- Persistence

- Mapping

- Filtering

- Transaction participation

Repositories never:

- Validate parent existence

- Authorize

- Assign defaults

- Enforce business rules

---

# Error Handling

## Application

Responsible for:

- Validation errors

- Business errors

- Authorization errors

---

## Database

Responsible for:

- Database conflict translation

---

## Web

Responsible for:

- User-safe messages

- Action state

- Redirects

- Route revalidation

---

# Server Action Rules

Always:

- Parse FormData

- Resolve request context

- Invoke application services

- Map errors

- Redirect after successful execution

Never:

- Import Prisma

- Implement business rules

- Authorize

- Validate parent entities

---

# UI Rules

Always:

- Use route helpers

- Preserve user input

- Preserve field errors

- Use accessible labels

- Disable submit while pending

Never:

- Display raw IDs

- Duplicate validation

- Duplicate authorization

---

# Common Pitfalls

## ❌ Don't

```tsx

value={code || state.values?.code || ''}

```

### ✅ Do

Use local component state and intentionally synchronize server-returned values after an action error.

---

## ❌ Don't

```ts

try {

    redirect(...)

}

```

### ✅ Do

```ts

try {

    ...

}

redirect(...)

```

---

Never:

- Validate parents inside repositories

- Assign defaults inside repositories

- Trust browser tenant IDs

- Display foreign keys

- Import Prisma into server actions

---

# Git Workflow

```

main

    ↓

feature/<entity>

        ↓

feature/<entity>-web

        ↓

Merge

        ↓

main

```

---

# Commit Strategy

## Backend

```text

feat(<entity>): implement backend through persistence

```

## Web Composition

```text

feat(<entity>): add web composition

```

## List UI

```text

feat(<entity>): add list page

```

## Detail UI

```text

feat(<entity>): add detail page

```

## Infrastructure

```text

build: update pnpm lockfile

```

---

# Merge Strategy

Always use:

```bash

git merge --no-ff

```

Flow:

```

feature/<entity>-web

        ↓

feature/<entity>

        ↓

main

```

Preserve implementation history.

Avoid squash merges unless there is a compelling reason.

---

# Definition of Done

A module is complete when:

- ✅ Domain complete

- ✅ Application complete

- ✅ Persistence complete

- ✅ Web composition complete

- ✅ Create flow complete

- ✅ List page complete

- ✅ Detail page complete

- ✅ Tests passing

- ✅ Typechecks passing

- ✅ Merged to `main`

---

# Reference Modules

## Programs

Reference for:

- Standalone entity

- CRUD pattern

- Composition root

- Basic list/detail UI

---

## Projects

Reference for:

- Parent-child relationships

- Optional relationships

- Composed detail pages

- Permission-aware create UI

---

## Future Reference Modules

### Milestones

Reference for:

- Nested hierarchy

### Budget

Reference for:

- Financial workflows

### Documents

Reference for:

- Uploads

- Storage

- Versioning

### Workflow

Reference for:

- Approvals

- State transitions

- Notifications

---

# AI Collaboration Guidelines

Before implementing:

1. Inspect the appropriate reference module.

2. Reuse existing architectural patterns.

3. Document intentional deviations.

Implementation rules:

- One implementation phase per review.

- One review before every commit.

- Small, coherent commits.

- Preserve architecture over convenience.

- Prefer consistency over novelty.

When introducing a new pattern:

- Explain why the existing pattern is insufficient.

- Document the architectural decision.

- Determine whether it should become the new reference implementation.

---

# Cursor Prompt Template

Every implementation prompt should include:

1. Objective

2. Reference modules

3. Scope

4. Deliverables

5. Constraints

6. Architectural rules

7. Testing requirements

8. Expected report

9. Commit policy

Prompt priorities:

- Reuse existing patterns

- Respect layer boundaries

- No contract changes without justification

- Green tests before review

- No commits or pushes until approved

---

# Future Module Roadmap

```

Program

    ↓

Project

    ↓

Milestone

    ↓

Deliverable

```

Parallel modules:

- Risk

- Decision

- Budget Line

- Forecast

- Expense

- Commitment

- Quote

- Contract

- Statement of Work

- Purchase Order

- Invoice

- Document

- Executive Report

Each new module should extend the established architecture rather than introduce a new one.

---

# Living Document

This playbook is expected to evolve.

When a new architectural pattern proves reusable:

1. Update this document.

2. Identify the new reference module.

3. Record the architectural rationale.

4. Apply the updated pattern to future modules.

> **Guiding Principle:**  

> Introduce a new architectural pattern only when it provides a demonstrable improvement over the existing reference implementation. Consistency is the default; evolution must be intentional and documented.