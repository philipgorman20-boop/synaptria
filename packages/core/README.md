# @synaptria/core

Framework-independent primitives shared across Synaptria packages.

## Rules

- Must not depend on React, Next.js, Prisma, database drivers, or application modules.
- Contains only stable cross-cutting contracts and deterministic utilities.
- Tenant identity must be constructed from trusted server-side authentication and membership data.
- Expected failures use typed errors or `Result<T, E>`; programming errors may still throw.

## Public areas

- `context` — request and tenant context contracts
- `errors` — typed platform errors
- `ids` — branded identifier types and factories
- `result` — discriminated success/failure values
- `time` — clock abstraction
- `pagination` — normalized pagination contracts
