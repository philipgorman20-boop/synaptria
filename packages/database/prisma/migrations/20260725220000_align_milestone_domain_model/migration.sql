-- Align Milestone model with approved domain (Program -> Project -> Milestone).
-- Development database contained zero Milestone rows at migration time.

-- Drop foreign keys and indexes for removed Milestone columns
ALTER TABLE "Milestone" DROP CONSTRAINT "Milestone_programId_fkey";
ALTER TABLE "Milestone" DROP CONSTRAINT "Milestone_ownerId_fkey";

DROP INDEX "Milestone_programId_idx";
DROP INDEX "Milestone_ownerId_idx";
DROP INDEX "Milestone_targetDate_idx";

-- Remove legacy columns
ALTER TABLE "Milestone" DROP COLUMN "programId";
ALTER TABLE "Milestone" DROP COLUMN "ownerId";
ALTER TABLE "Milestone" DROP COLUMN "targetDate";
ALTER TABLE "Milestone" DROP COLUMN "completedAt";
ALTER TABLE "Milestone" DROP COLUMN "percentComplete";

-- Add domain date fields
ALTER TABLE "Milestone" ADD COLUMN "plannedStartDate" TIMESTAMP(3);
ALTER TABLE "Milestone" ADD COLUMN "plannedEndDate" TIMESTAMP(3);
ALTER TABLE "Milestone" ADD COLUMN "actualStartDate" TIMESTAMP(3);
ALTER TABLE "Milestone" ADD COLUMN "actualEndDate" TIMESTAMP(3);

-- Require project ownership
ALTER TABLE "Milestone" ALTER COLUMN "projectId" SET NOT NULL;

-- Replace MilestoneStatus enum values
CREATE TYPE "MilestoneStatus_new" AS ENUM ('PLANNED', 'IN_PROGRESS', 'BLOCKED', 'COMPLETED', 'CANCELLED');

ALTER TABLE "Milestone" ALTER COLUMN "status" DROP DEFAULT;
ALTER TABLE "Milestone" ALTER COLUMN "status" TYPE "MilestoneStatus_new" USING (
  CASE "status"::text
    WHEN 'NOT_STARTED' THEN 'PLANNED'
    WHEN 'AT_RISK' THEN 'BLOCKED'
    WHEN 'IN_PROGRESS' THEN 'IN_PROGRESS'
    WHEN 'BLOCKED' THEN 'BLOCKED'
    WHEN 'COMPLETED' THEN 'COMPLETED'
    WHEN 'CANCELLED' THEN 'CANCELLED'
  END::"MilestoneStatus_new"
);

DROP TYPE "MilestoneStatus";
ALTER TYPE "MilestoneStatus_new" RENAME TO "MilestoneStatus";
ALTER TABLE "Milestone" ALTER COLUMN "status" SET DEFAULT 'PLANNED';

-- Add planned end date index
CREATE INDEX "Milestone_plannedEndDate_idx" ON "Milestone"("plannedEndDate");
