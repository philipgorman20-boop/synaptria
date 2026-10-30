import type {
  MilestoneId,
  OrganizationId,
  ProgramId,
  ProjectId,
  RiskId,
  UserId,
} from '@synaptria/core';

export type RiskStatus = 'OPEN' | 'MITIGATING' | 'ACCEPTED' | 'CLOSED';

export type RiskCategory =
  | 'SCIENTIFIC'
  | 'CLINICAL'
  | 'REGULATORY'
  | 'CMC'
  | 'MANUFACTURING'
  | 'FINANCIAL'
  | 'VENDOR'
  | 'OPERATIONAL'
  | 'LEGAL'
  | 'IP'
  | 'PEOPLE'
  | 'OTHER';

export type RiskProbability =
  | 'RARE'
  | 'UNLIKELY'
  | 'POSSIBLE'
  | 'LIKELY'
  | 'ALMOST_CERTAIN';

export type RiskImpact =
  | 'NEGLIGIBLE'
  | 'MINOR'
  | 'MODERATE'
  | 'MAJOR'
  | 'SEVERE';

export interface Risk {
  readonly id: RiskId;
  readonly organizationId: OrganizationId;
  readonly programId?: ProgramId;
  readonly projectId?: ProjectId;
  readonly milestoneId?: MilestoneId;
  readonly ownerId?: UserId;
  readonly createdById?: UserId;
  readonly title: string;
  readonly description?: string;
  readonly category: RiskCategory;
  readonly status: RiskStatus;
  readonly probability: RiskProbability;
  readonly impact: RiskImpact;
  readonly mitigationPlan?: string;
  readonly contingencyPlan?: string;
  readonly reviewDate?: Date;
  readonly closedAt?: Date;
  readonly deletedAt?: Date;
  readonly createdAt: Date;
  readonly updatedAt: Date;
}
