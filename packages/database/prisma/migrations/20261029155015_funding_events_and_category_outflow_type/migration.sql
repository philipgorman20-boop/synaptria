-- CreateEnum
CREATE TYPE "BudgetCategoryOutflowType" AS ENUM ('OPERATIONAL', 'DISCRETIONARY');

-- CreateEnum
CREATE TYPE "FundingEventType" AS ENUM ('SEED', 'SERIES_A', 'SERIES_B', 'SERIES_C', 'SERIES_D', 'GRANT', 'REVENUE', 'LOAN', 'CONVERTIBLE_NOTE', 'SAFE', 'OTHER');

-- CreateEnum
CREATE TYPE "FundingEventStatus" AS ENUM ('COMMITTED', 'RECEIVED');

-- AlterTable
ALTER TABLE "BudgetCategory" ADD COLUMN     "outflowType" "BudgetCategoryOutflowType" NOT NULL DEFAULT 'OPERATIONAL';

-- CreateTable
CREATE TABLE "FundingEvent" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "type" "FundingEventType" NOT NULL,
    "status" "FundingEventStatus" NOT NULL DEFAULT 'COMMITTED',
    "amount" DECIMAL(18,2) NOT NULL,
    "currency" VARCHAR(3) NOT NULL DEFAULT 'USD',
    "receivedAt" TIMESTAMP(3),
    "expectedAt" TIMESTAMP(3),
    "investor" TEXT,
    "notes" TEXT,
    "deletedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "FundingEvent_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "FundingEvent_organizationId_status_idx" ON "FundingEvent"("organizationId", "status");

-- CreateIndex
CREATE INDEX "FundingEvent_organizationId_type_idx" ON "FundingEvent"("organizationId", "type");

-- CreateIndex
CREATE INDEX "FundingEvent_organizationId_deletedAt_idx" ON "FundingEvent"("organizationId", "deletedAt");

-- AddForeignKey
ALTER TABLE "FundingEvent" ADD CONSTRAINT "FundingEvent_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;
