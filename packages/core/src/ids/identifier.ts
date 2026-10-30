declare const identifierBrand: unique symbol;

export type Identifier<TName extends string = string> = string & {
  readonly [identifierBrand]: TName;
};

export type UserId = Identifier<'UserId'>;
export type OrganizationId = Identifier<'OrganizationId'>;
export type MembershipId = Identifier<'MembershipId'>;
export type ProgramId = Identifier<'ProgramId'>;
export type ProjectId = Identifier<'ProjectId'>;
export type MilestoneId = Identifier<'MilestoneId'>;
export type TaskId = Identifier<'TaskId'>;
export type RiskId = Identifier<'RiskId'>;
export type DecisionId = Identifier<'DecisionId'>;
export type VendorId = Identifier<'VendorId'>;
export type DocumentId = Identifier<'DocumentId'>;
export type BudgetId = Identifier<'BudgetId'>;
export type BudgetLineId = Identifier<'BudgetLineId'>;
export type BudgetCategoryId = Identifier<'BudgetCategoryId'>;
export type FundingEventId = Identifier<'FundingEventId'>;
export type RequestId = Identifier<'RequestId'>;
export type CorrelationId = Identifier<'CorrelationId'>;

export function identifier<TName extends string>(value: string, name: TName): Identifier<TName> {
  const normalized = value.trim();

  if (normalized.length === 0) {
    throw new TypeError(`${name} cannot be empty.`);
  }

  return normalized as Identifier<TName>;
}

export const userId = (value: string): UserId => identifier(value, 'UserId');
export const organizationId = (value: string): OrganizationId =>
  identifier(value, 'OrganizationId');
export const membershipId = (value: string): MembershipId => identifier(value, 'MembershipId');
export const programId = (value: string): ProgramId => identifier(value, 'ProgramId');
export const projectId = (value: string): ProjectId => identifier(value, 'ProjectId');
export const milestoneId = (value: string): MilestoneId => identifier(value, 'MilestoneId');
export const taskId = (value: string): TaskId => identifier(value, 'TaskId');
export const riskId = (value: string): RiskId => identifier(value, 'RiskId');
export const decisionId = (value: string): DecisionId => identifier(value, 'DecisionId');
export const vendorId = (value: string): VendorId => identifier(value, 'VendorId');
export const documentId = (value: string): DocumentId => identifier(value, 'DocumentId');
export const budgetId = (value: string): BudgetId => identifier(value, 'BudgetId');
export const budgetLineId = (value: string): BudgetLineId => identifier(value, 'BudgetLineId');
export const budgetCategoryId = (value: string): BudgetCategoryId => identifier(value, 'BudgetCategoryId');
export const fundingEventId = (value: string): FundingEventId => identifier(value, 'FundingEventId');
export const requestId = (value: string): RequestId => identifier(value, 'RequestId');
export const correlationId = (value: string): CorrelationId => identifier(value, 'CorrelationId');
