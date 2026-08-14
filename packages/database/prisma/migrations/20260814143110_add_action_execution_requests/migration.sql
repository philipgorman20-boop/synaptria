-- CreateEnum
CREATE TYPE "ActionExecutionRequestStatus" AS ENUM ('PENDING_CONFIRMATION', 'CONFIRMED');

-- CreateTable
CREATE TABLE "ActionExecutionRequest" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "actionProposalId" TEXT NOT NULL,
    "recommendationId" TEXT NOT NULL,
    "actionType" TEXT NOT NULL,
    "targetEntityType" TEXT NOT NULL,
    "targetEntityId" TEXT NOT NULL,
    "proposedChanges" JSONB NOT NULL,
    "preconditions" JSONB NOT NULL,
    "status" "ActionExecutionRequestStatus" NOT NULL DEFAULT 'PENDING_CONFIRMATION',
    "requestedByUserId" TEXT NOT NULL,
    "requestedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "confirmedByUserId" TEXT,
    "confirmedAt" TIMESTAMP(3),
    "createIdempotencyKey" TEXT NOT NULL,
    "confirmIdempotencyKey" TEXT,
    "snapshotFingerprint" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ActionExecutionRequest_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ActionExecutionRequest_organizationId_status_idx" ON "ActionExecutionRequest"("organizationId", "status");

-- CreateIndex
CREATE INDEX "ActionExecutionRequest_organizationId_requestedAt_idx" ON "ActionExecutionRequest"("organizationId", "requestedAt");

-- CreateIndex
CREATE INDEX "ActionExecutionRequest_organizationId_actionProposalId_idx" ON "ActionExecutionRequest"("organizationId", "actionProposalId");

-- CreateIndex
CREATE INDEX "ActionExecutionRequest_requestedByUserId_idx" ON "ActionExecutionRequest"("requestedByUserId");

-- CreateIndex
CREATE INDEX "ActionExecutionRequest_confirmedByUserId_idx" ON "ActionExecutionRequest"("confirmedByUserId");

-- CreateIndex
CREATE UNIQUE INDEX "ActionExecutionRequest_organizationId_snapshotFingerprint_key" ON "ActionExecutionRequest"("organizationId", "snapshotFingerprint");

-- CreateIndex
CREATE UNIQUE INDEX "ActionExecutionRequest_organizationId_createIdempotencyKey_key" ON "ActionExecutionRequest"("organizationId", "createIdempotencyKey");

-- CreateIndex
CREATE UNIQUE INDEX "ActionExecutionRequest_organizationId_confirmIdempotencyKey_key" ON "ActionExecutionRequest"("organizationId", "confirmIdempotencyKey");

-- AddForeignKey
ALTER TABLE "ActionExecutionRequest" ADD CONSTRAINT "ActionExecutionRequest_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ActionExecutionRequest" ADD CONSTRAINT "ActionExecutionRequest_requestedByUserId_fkey" FOREIGN KEY ("requestedByUserId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ActionExecutionRequest" ADD CONSTRAINT "ActionExecutionRequest_confirmedByUserId_fkey" FOREIGN KEY ("confirmedByUserId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- RenameIndex
ALTER INDEX "RecommendationReviewDecision_organizationId_recommendationId_ke" RENAME TO "RecommendationReviewDecision_organizationId_recommendationI_key";
