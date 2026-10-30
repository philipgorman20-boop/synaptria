-- CreateEnum
CREATE TYPE "RecommendationReviewDecisionType" AS ENUM ('ACCEPTED', 'DISMISSED');

-- CreateTable
CREATE TABLE "RecommendationReviewDecision" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "recommendationId" TEXT NOT NULL,
    "decision" "RecommendationReviewDecisionType" NOT NULL,
    "reviewedByUserId" TEXT NOT NULL,
    "reviewedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "dismissalReason" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "RecommendationReviewDecision_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "RecommendationReviewDecision_organizationId_reviewedAt_idx" ON "RecommendationReviewDecision"("organizationId", "reviewedAt");

-- CreateIndex
CREATE INDEX "RecommendationReviewDecision_reviewedByUserId_idx" ON "RecommendationReviewDecision"("reviewedByUserId");

-- CreateIndex
CREATE UNIQUE INDEX "RecommendationReviewDecision_organizationId_recommendationId_key" ON "RecommendationReviewDecision"("organizationId", "recommendationId");

-- AddForeignKey
ALTER TABLE "RecommendationReviewDecision" ADD CONSTRAINT "RecommendationReviewDecision_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RecommendationReviewDecision" ADD CONSTRAINT "RecommendationReviewDecision_reviewedByUserId_fkey" FOREIGN KEY ("reviewedByUserId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
