import type {
  BudgetCategoryId,
  BudgetId,
  BudgetLineId,
  FundingEventId,
  OrganizationId,
  ProgramId,
  ProjectId,
} from '@synaptria/core';

export type BudgetStatus = 'DRAFT' | 'APPROVED' | 'ACTIVE' | 'CLOSED' | 'ARCHIVED';
export type BudgetPeriodType = 'MONTHLY' | 'QUARTERLY' | 'ANNUAL' | 'CUSTOM';
export type BudgetCategoryOutflowType = 'OPERATIONAL' | 'DISCRETIONARY';
export type FundingEventType =
  | 'SEED'
  | 'SERIES_A'
  | 'SERIES_B'
  | 'SERIES_C'
  | 'SERIES_D'
  | 'GRANT'
  | 'REVENUE'
  | 'LOAN'
  | 'CONVERTIBLE_NOTE'
  | 'SAFE'
  | 'OTHER';
export type FundingEventStatus = 'COMMITTED' | 'RECEIVED';

export interface Budget {
  readonly id: BudgetId;
  readonly organizationId: OrganizationId;
  readonly name: string;
  readonly description?: string;
  readonly status: BudgetStatus;
  readonly periodType: BudgetPeriodType;
  readonly currency: string;
  readonly startDate: Date;
  readonly endDate: Date;
  readonly approvedAt?: Date;
  readonly deletedAt?: Date;
  readonly createdAt: Date;
  readonly updatedAt: Date;
}

export interface BudgetCategory {
  readonly id: BudgetCategoryId;
  readonly organizationId: OrganizationId;
  readonly parentId?: BudgetCategoryId;
  readonly name: string;
  readonly code?: string;
  readonly description?: string;
  readonly isActive: boolean;
  readonly outflowType: BudgetCategoryOutflowType;
  readonly deletedAt?: Date;
  readonly createdAt: Date;
  readonly updatedAt: Date;
}

export interface FundingEvent {
  readonly id: FundingEventId;
  readonly organizationId: OrganizationId;
  readonly name: string;
  readonly type: FundingEventType;
  readonly status: FundingEventStatus;
  readonly amount: number;
  readonly currency: string;
  readonly receivedAt?: Date;
  readonly expectedAt?: Date;
  readonly investor?: string;
  readonly notes?: string;
  readonly deletedAt?: Date;
  readonly createdAt: Date;
  readonly updatedAt: Date;
}

export interface BudgetLine {
  readonly id: BudgetLineId;
  readonly organizationId: OrganizationId;
  readonly budgetId: BudgetId;
  readonly categoryId: BudgetCategoryId;
  readonly programId?: ProgramId;
  readonly projectId?: ProjectId;
  readonly name: string;
  readonly notes?: string;
  readonly plannedAmount: number;
  readonly committedAmount: number;
  readonly actualAmount: number;
  readonly forecastAmount: number;
  readonly currency: string;
  readonly periodStart: Date;
  readonly periodEnd: Date;
  readonly deletedAt?: Date;
  readonly createdAt: Date;
  readonly updatedAt: Date;
}
