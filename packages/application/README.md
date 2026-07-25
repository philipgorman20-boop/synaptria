# @synaptria/application

Synaptria's application layer coordinates business use cases across the product.
It contains commands, queries, DTOs, and application services, while keeping UI,
persistence, and external integrations outside the package.

## Dependency rules

- May depend on shared contracts such as `@synaptria/types`.
- Must not import React, Next.js, route handlers, or UI components.
- Must not expose Prisma models as public DTOs.
- Must receive authenticated tenant context from a trusted server-side adapter.
- Business mutations will use the shared audit and domain-event ports introduced
  during Sprint 1.

## Module layout

Each module will evolve toward this internal structure as implementation begins:

```text
commands/
queries/
dto/
services/
repositories/
validators/
permissions/
events/
errors/
index.ts
```

Only module `index.ts` files form the supported public API.
