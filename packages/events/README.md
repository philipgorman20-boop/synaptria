# @synaptria/events

Persistence-independent domain-event contracts and publishing services for Synaptria.

## Responsibilities

- Create consistent, tenant-aware event envelopes.
- Propagate actor, request, and correlation identity.
- Serialize payloads and metadata safely.
- Support delayed publication and event versioning.
- Provide repository and idempotency abstractions.
- Prevent duplicate publication when an idempotency store is configured.

The package intentionally does not depend on Prisma, Next.js, React, or a message broker. Database adapters and background workers belong in infrastructure packages.

## Example

```ts
await events.publish({
  context,
  event: {
    type: 'program.created',
    aggregateType: 'Program',
    aggregateId: program.id,
    payload: { name: program.name },
    idempotencyKey: command.idempotencyKey,
  },
});
```
