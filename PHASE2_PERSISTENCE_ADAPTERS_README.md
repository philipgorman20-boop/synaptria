# Phase 2 Persistence Adapters

This patch adds Prisma implementations for the audit and domain-event repository contracts.

## Install

Extract from the Synaptria repository root, then run:

```bash
pnpm install
pnpm --filter @synaptria/database typecheck
pnpm --filter @synaptria/database lint
pnpm --filter @synaptria/database test
pnpm --filter @synaptria/web typecheck
pnpm --filter @synaptria/web build
```

## Added capabilities

- `PrismaAuditRepository`
- `PrismaEventRepository`
- shared JSON conversion for Prisma
- persistence repository composition
- `withDatabaseTransaction` for atomic multi-repository operations
- unit tests for audit and event mapping

The event adapter stores envelope-only context (`actorId`, `requestId`, `idempotencyKey`, and `occurredAt`) inside a reserved metadata object because those columns are not present in the current Prisma model. The adapter removes that reserved object when returning public event metadata.
