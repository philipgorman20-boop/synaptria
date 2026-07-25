# Domain Layer

`@synaptria/domain` owns framework-independent business models and repository contracts.

The domain package may depend on `@synaptria/core`, but it must not depend on Prisma,
Next.js, Auth.js, the application layer, or infrastructure packages.

The application layer orchestrates use cases against domain contracts. Persistence
adapters in `@synaptria/database` implement those contracts using Prisma.
