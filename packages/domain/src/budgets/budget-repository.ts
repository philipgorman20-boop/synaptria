import type {
  BudgetCategoryId,
  BudgetId,
  BudgetLineId,
  FundingEventId,
  OrganizationId,
  ProgramId,
  ProjectId,
} from '@synaptria/core';

import type { Budget, BudgetCategory, BudgetCategoryOutflowType, BudgetLine, BudgetPeriodType, BudgetStatus, FundingEvent, FundingEventStatus, FundingEventType } from './models';

export interface CreateBudgetInput {
  readonly organizationId: OrganizationId;
  readonly name: string;
  readonly description?: string;
  readonly status?: BudgetStatus;
  readonly periodType?: BudgetPeriodType;
  readonly currency?: string;
  readonly startDate: Date;
  readonly endDate: Date;
}

export interface UpdateBudgetInput {
  readonly name?: string;
  readonly description?: string;
  readonly status?: BudgetStatus;
  readonly periodType?: BudgetPeriodType;
  readonly currency?: string;
  readonly startDate?: Date;
  readonly endDate?: Date;
  readonly approvedAt?: Date;
}

export interface BudgetRepository {
  create(input: CreateBudgetInput): Promise<Budget>;
  findById(organizationId: OrganizationId, id: BudgetId): Promise<Budget | null>;
  update(organizationId: OrganizationId, id: BudgetId, input: UpdateBudgetInput): Promise<Budget>;
  softDelete(organizationId: OrganizationId, id: BudgetId): Promise<void>;
  listForOrganization(organizationId: OrganizationId): Promise<readonly Budget[]>;
}

export interface CreateBudgetLineInput {
  readonly organizationId: OrganizationId;
  readonly budgetId: BudgetId;
  readonly categoryId: BudgetCategoryId;
  readonly programId?: ProgramId;
  readonly projectId?: ProjectId;
  readonly name: string;
  readonly notes?: string;
  readonly plannedAmount?: number;
  readonly actualAmount?: number;
  readonly currency?: string;
  readonly periodStart: Date;
  readonly periodEnd: Date;
}

export interface UpdateBudgetLineInput {
  readonly categoryId?: BudgetCategoryId;
  readonly programId?: ProgramId | null;
  readonly projectId?: ProjectId | null;
  readonly name?: string;
  readonly notes?: string | null;
  readonly plannedAmount?: number;
  readonly actualAmount?: number;
  readonly currency?: string;
  readonly periodStart?: Date;
  readonly periodEnd?: Date;
}

export interface BudgetLineRepository {
  create(input: CreateBudgetLineInput): Promise<BudgetLine>;
  findById(organizationId: OrganizationId, id: BudgetLineId): Promise<BudgetLine | null>;
  update(organizationId: OrganizationId, id: BudgetLineId, input: UpdateBudgetLineInput): Promise<BudgetLine>;
  softDelete(organizationId: OrganizationId, id: BudgetLineId): Promise<void>;
  listForBudget(organizationId: OrganizationId, budgetId: BudgetId): Promise<readonly BudgetLine[]>;
  listForOrganization(organizationId: OrganizationId): Promise<readonly BudgetLine[]>;
}

export interface CreateBudgetCategoryInput {
  readonly organizationId: OrganizationId;
  readonly name: string;
  readonly outflowType?: BudgetCategoryOutflowType;
  readonly description?: string;
  readonly code?: string;
}

export interface UpdateBudgetCategoryInput {
  readonly name?: string;
  readonly outflowType?: BudgetCategoryOutflowType;
  readonly description?: string | null;
  readonly code?: string | null;
  readonly isActive?: boolean;
}

export interface BudgetCategoryRepository {
  listForOrganization(organizationId: OrganizationId): Promise<readonly BudgetCategory[]>;
  findById(organizationId: OrganizationId, id: BudgetCategoryId): Promise<BudgetCategory | null>;
  create(input: CreateBudgetCategoryInput): Promise<BudgetCategory>;
  update(organizationId: OrganizationId, id: BudgetCategoryId, input: UpdateBudgetCategoryInput): Promise<BudgetCategory>;
  softDelete(organizationId: OrganizationId, id: BudgetCategoryId): Promise<void>;
}

export interface CreateFundingEventInput {
  readonly organizationId: OrganizationId;
  readonly name: string;
  readonly type: FundingEventType;
  readonly status?: FundingEventStatus;
  readonly amount: number;
  readonly currency?: string;
  readonly receivedAt?: Date;
  readonly expectedAt?: Date;
  readonly investor?: string;
  readonly notes?: string;
}

export interface UpdateFundingEventInput {
  readonly name?: string;
  readonly type?: FundingEventType;
  readonly status?: FundingEventStatus;
  readonly amount?: number;
  readonly currency?: string;
  readonly receivedAt?: Date | null;
  readonly expectedAt?: Date | null;
  readonly investor?: string | null;
  readonly notes?: string | null;
}

export interface FundingEventRepository {
  create(input: CreateFundingEventInput): Promise<FundingEvent>;
  findById(organizationId: OrganizationId, id: FundingEventId): Promise<FundingEvent | null>;
  update(organizationId: OrganizationId, id: FundingEventId, input: UpdateFundingEventInput): Promise<FundingEvent>;
  softDelete(organizationId: OrganizationId, id: FundingEventId): Promise<void>;
  listForOrganization(organizationId: OrganizationId): Promise<readonly FundingEvent[]>;
}

export type { BudgetCategoryOutflowType };
