-- Add index for organization-scoped recent DomainEvent reads ordered by occurrence time.

CREATE INDEX "DomainEvent_organizationId_createdAt_id_idx" ON "DomainEvent"("organizationId", "createdAt" DESC, "id" ASC);
