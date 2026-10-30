import type {
  MilestoneId,
  OrganizationId,
  ProgramId,
  ProjectId,
  RiskId,
  UserId,
} from '@synaptria/core';

import type {
  Risk,
  RiskCategory,
  RiskImpact,
  RiskProbability,
  RiskStatus,
} from './models';

export interface CreateRiskInput {
  readonly organizationId: OrganizationId;
  readonly programId?: ProgramId;
  readonly projectId?: ProjectId;
  readonly milestoneId?: MilestoneId;
  readonly ownerId?: UserId;
  readonly createdById?: UserId;
  readonly title: string;
  readonly description?: string;
  readonly category: RiskCategory;
  readonly status?: RiskStatus;
  readonly probability?: RiskProbability;
  readonly impact?: RiskImpact;
  readonly mitigationPlan?: string;
  readonly contingencyPlan?: string;
  readonly reviewDate?: Date;
}

export interface UpdateRiskInput {
  readonly title?: string;
  readonly description?: string | null;
  readonly category?: RiskCategory;
  readonly status?: RiskStatus;
  readonly probability?: RiskProbability;
  readonly impact?: RiskImpact;
  readonly mitigationPlan?: string | null;
  readonly contingencyPlan?: string | null;
  readonly reviewDate?: Date | null;
  readonly closedAt?: Date | null;
  readonly ownerId?: UserId | null;
  readonly programId?: ProgramId | null;
  readonly projectId?: ProjectId | null;
  readonly milestoneId?: MilestoneId | null;
}

export interface RiskRepository {
  create(input: CreateRiskInput): Promise<Risk>;
  findById(organizationId: OrganizationId, id: RiskId): Promise<Risk | null>;
  update(organizationId: OrganizationId, id: RiskId, input: UpdateRiskInput): Promise<Risk>;
  softDelete(organizationId: OrganizationId, id: RiskId, deletedAt: Date): Promise<Risk>;
  listForOrganization(organizationId: OrganizationId): Promise<readonly Risk[]>;
  listForProject(organizationId: OrganizationId, projectId: ProjectId): Promise<readonly Risk[]>;
  listForProgram(organizationId: OrganizationId, programId: ProgramId): Promise<readonly Risk[]>;
}
